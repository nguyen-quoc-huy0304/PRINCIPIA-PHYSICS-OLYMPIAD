package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	maxResponseBytes = 2 << 20
	ssiBaseURL        = "https://fc-data.ssi.com.vn/api/v2/Market"
	fxBaseURL         = "https://open.er-api.com/v6/latest"
	bdsBaseURL        = "https://api.bds.chat"
)

type server struct {
	client *http.Client
	origin string
	ssiID string
	ssiSecret string
	bdsKey string
	tokenMu sync.Mutex
	token string
	tokenExpiry time.Time
}

func newServer() *server {
	return &server{
		client: &http.Client{Timeout: 8 * time.Second},
		origin: strings.TrimSpace(os.Getenv("ALLOWED_ORIGIN")),
		ssiID: strings.TrimSpace(os.Getenv("SSI_CONSUMER_ID")),
		ssiSecret: strings.TrimSpace(os.Getenv("SSI_CONSUMER_SECRET")),
		bdsKey: strings.TrimSpace(os.Getenv("BDS_CHAT_API_KEY")),
	}
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("GET /v1/market/stocks", s.stocks)
	mux.HandleFunc("GET /v1/market/fx", s.fx)
	mux.HandleFunc("GET /v1/market/real-estate", s.realEstate)
	return s.cors(mux)
}

func (s *server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if s.origin != "" && origin == s.origin {
			w.Header().Set("Access-Control-Allow-Origin", s.origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		}
		if r.Method == http.MethodOptions {
			if s.origin == "" || origin != s.origin {
				http.Error(w, "origin not allowed", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"service": "principia-market-data",
		"providers": map[string]bool{
			"stocks": s.ssiID != "" && s.ssiSecret != "",
			"fx": true,
			"realEstate": s.bdsKey != "",
		},
	})
}

func (s *server) stocks(w http.ResponseWriter, r *http.Request) {
	if s.ssiID == "" || s.ssiSecret == "" {
		writeError(w, http.StatusServiceUnavailable, "SSI FastConnect credentials are not configured")
		return
	}
	symbols, err := parseSymbols(r.URL.Query().Get("symbols"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	token, err := s.ssiAccessToken(r.Context())
	if err != nil {
		writeError(w, http.StatusBadGateway, "SSI authentication failed")
		return
	}
	today := time.Now().Format("02/01/2006")
	rows := make([]json.RawMessage, 0, len(symbols))
	for _, symbol := range symbols {
		query := url.Values{
			"symbol": {symbol}, "fromDate": {today}, "toDate": {today},
			"pageIndex": {"1"}, "pageSize": {"100"}, "ascending": {"false"},
			"resollution": {"1"},
		}
		endpoint := ssiBaseURL + "/IntradayOhlc?" + query.Encode()
		body, status, fetchErr := ssiGet(r.Context(), s.client, endpoint, token)
		if fetchErr != nil || status < 200 || status >= 300 {
			continue
		}
		var payload struct { Data []json.RawMessage `json:"data"` }
		if json.Unmarshal(body, &payload) == nil {
			rows = append(rows, payload.Data...)
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"provider": "SSI FastConnect", "kind": "intraday",
		"fetchedAt": time.Now().UTC().Format(time.RFC3339), "data": rows,
	})
}

func (s *server) ssiAccessToken(ctx context.Context) (string, error) {
	s.tokenMu.Lock()
	defer s.tokenMu.Unlock()
	if s.token != "" && time.Now().Before(s.tokenExpiry) { return s.token, nil }
	payload, _ := json.Marshal(map[string]string{
		"consumerID": s.ssiID, "consumerSecret": s.ssiSecret,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ssiBaseURL+"/AccessToken", strings.NewReader(string(payload)))
	if err != nil { return "", err }
	req.Header.Set("Content-Type", "application/json")
	body, err := s.do(req)
	if err != nil { return "", err }
	var response struct {
		Data struct { AccessToken string `json:"accessToken"` } `json:"data"`
	}
	if err := json.Unmarshal(body, &response); err != nil || response.Data.AccessToken == "" {
		return "", errors.New("SSI returned an invalid access token")
	}
	s.token = response.Data.AccessToken
	s.tokenExpiry = time.Now().Add(50 * time.Minute)
	return s.token, nil
}

func (s *server) fx(w http.ResponseWriter, r *http.Request) {
	base := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("base")))
	if base == "" { base = "USD" }
	if !validCurrency(base) { writeError(w, http.StatusBadRequest, "unsupported base currency"); return }
	endpoint := fxBaseURL + "/" + url.PathEscape(base)
	body, status, err := ssiGet(r.Context(), s.client, endpoint, "")
	if err != nil || status < 200 || status >= 300 {
		writeError(w, http.StatusBadGateway, "foreign exchange provider unavailable")
		return
	}
	var payload struct {
		Result string `json:"result"`
		Base string `json:"base_code"`
		Date string `json:"time_last_update_utc"`
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.Unmarshal(body, &payload); err != nil || payload.Result != "success" || len(payload.Rates) == 0 {
		writeError(w, http.StatusBadGateway, "foreign exchange provider returned invalid data")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"provider": "ExchangeRate-API Open Access", "kind": "latest-reference",
		"base": payload.Base, "providerUpdatedAt": payload.Date,
		"fetchedAt": time.Now().UTC().Format(time.RFC3339), "rates": payload.Rates,
	})
}

func (s *server) realEstate(w http.ResponseWriter, r *http.Request) {
	if s.bdsKey == "" {
		writeError(w, http.StatusServiceUnavailable, "BDS Chat API key is not configured")
		return
	}
	limit := 20
	if raw := r.URL.Query().Get("limit"); raw != "" {
		value, err := strconv.Atoi(raw)
		if err != nil || value < 1 || value > 50 { writeError(w, http.StatusBadRequest, "limit must be between 1 and 50"); return }
		limit = value
	}
	query := url.Values{"limit": {strconv.Itoa(limit)}, "sort": {"newest"}}
	for _, key := range []string{"district", "ward", "min_price", "max_price", "min_area", "max_area"} {
		value := strings.TrimSpace(r.URL.Query().Get(key))
		if len(value) > 80 { writeError(w, http.StatusBadRequest, "filter too long: "+key); return }
		if value != "" { query.Set(key, value) }
	}
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, bdsBaseURL+"/listings?"+query.Encode(), nil)
	if err != nil { writeError(w, http.StatusBadRequest, "invalid real-estate request"); return }
	req.Header.Set("Authorization", "Bearer "+s.bdsKey)
	body, err := s.do(req)
	if err != nil { writeError(w, http.StatusBadGateway, "real-estate provider unavailable"); return }
	w.Header().Set("Cache-Control", "public, max-age=60")
	w.Header().Set("X-Data-Source", "BDS Chat")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

func parseSymbols(raw string) ([]string, error) {
	if raw == "" { return nil, errors.New("symbols query is required") }
	parts := strings.Split(raw, ",")
	if len(parts) > 20 { return nil, errors.New("maximum 20 stock symbols per request") }
	result := make([]string, 0, len(parts))
	seen := make(map[string]bool, len(parts))
	for _, part := range parts {
		symbol := strings.ToUpper(strings.TrimSpace(part))
		if len(symbol) < 3 || len(symbol) > 10 { return nil, errors.New("invalid stock symbol") }
		for _, char := range symbol {
			if (char < 'A' || char > 'Z') && (char < '0' || char > '9') { return nil, errors.New("invalid stock symbol") }
		}
		if !seen[symbol] { result = append(result, symbol); seen[symbol] = true }
	}
	return result, nil
}

func validCurrency(code string) bool {
	if len(code) != 3 { return false }
	for _, char := range code { if char < 'A' || char > 'Z' { return false } }
	return true
}

func ssiGet(ctx context.Context, client *http.Client, endpoint, token string) ([]byte, int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil { return nil, 0, err }
	if token != "" { req.Header.Set("Authorization", "Bearer "+token) }
	response, err := client.Do(req)
	if err != nil { return nil, 0, err }
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseBytes+1))
	if err != nil || len(body) > maxResponseBytes { return nil, response.StatusCode, errors.New("response too large or unreadable") }
	return body, response.StatusCode, nil
}

func (s *server) do(req *http.Request) ([]byte, error) {
	response, err := s.client.Do(req)
	if err != nil { return nil, err }
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseBytes+1))
	if err != nil || len(body) > maxResponseBytes { return nil, errors.New("response too large or unreadable") }
	if response.StatusCode < 200 || response.StatusCode >= 300 { return nil, fmt.Errorf("upstream status %d", response.StatusCode) }
	return body, nil
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func main() {
	addr := strings.TrimSpace(os.Getenv("ADDR"))
	if addr == "" { addr = ":8090" }
	s := newServer()
	httpServer := &http.Server{
		Addr: addr, Handler: s.routes(), ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second, WriteTimeout: 12 * time.Second, IdleTimeout: 60 * time.Second,
	}
	log.Printf("PRINCIPIA market data service listening on %s", addr)
	log.Fatal(httpServer.ListenAndServe())
}
