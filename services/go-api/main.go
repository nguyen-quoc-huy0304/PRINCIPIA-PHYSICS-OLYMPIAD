package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

const maxBodyBytes = 64 << 10

type api struct {
	corePath     string
	allowedOrigin string
}

type coreResponse struct {
	ID    json.RawMessage `json:"id"`
	OK    bool            `json:"ok"`
	Value json.RawMessage `json:"value"`
	Error string          `json:"error"`
}

var operationFields = map[string][]string{
	"velocity": {"initial", "acceleration", "seconds"},
	"displacement": {"initial", "acceleration", "seconds"},
	"kineticEnergy": {"massKg", "speedMps"},
	"projectileRange": {"speed", "angleDeg", "gravity"},
	"projectileMaxHeight": {"speed", "angleDeg", "gravity"},
	"gameProjectileScore": {"speed", "angleDeg", "targetM", "gravity"},
	"rigidBodyDrop": {"initialHeightM", "gravityMps2", "radiusM", "restitution", "steps"},
	"linearRegression": {"points"},
	"robotArmIK": {"l1M", "l2M", "targetXM", "targetYM", "elbowBranch"},
}

func (a api) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "principia-go-api"})
	})
	mux.HandleFunc("POST /v1/compute", a.compute)
	mux.HandleFunc("POST /v1/game/trajectory", gameTrajectoryHandler)
	mux.HandleFunc("POST /v1/ai/generate", a.generateAI)
	return a.cors(mux)
}

func (a api) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if a.allowedOrigin != "" && origin == a.allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", a.allowedOrigin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			if a.allowedOrigin == "" || origin != a.allowedOrigin {
				http.Error(w, "origin not allowed", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a api) compute(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.UseNumber()
	var request map[string]any
	if err := decoder.Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON request")
		return
	}
	if err := ensureEOF(decoder); err != nil {
		writeError(w, http.StatusBadRequest, "request must contain one JSON object")
		return
	}
	op, ok := request["op"].(string)
	fields, supported := operationFields[op]
	if !ok || !supported {
		writeError(w, http.StatusUnprocessableEntity, "unsupported operation")
		return
	}
	if err := validateFields(request, fields); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	payload, err := json.Marshal(request)
	if err != nil {
		writeError(w, http.StatusBadRequest, "could not encode request")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, a.corePath)
	cmd.Stdin = bytes.NewReader(append(payload, '\n'))
	output, err := cmd.Output()
	if ctx.Err() != nil {
		writeError(w, http.StatusGatewayTimeout, "native core timed out")
		return
	}
	if err != nil {
		log.Printf("native core execution failed: %v", err)
		writeError(w, http.StatusBadGateway, "native core unavailable")
		return
	}
	var response coreResponse
	if err := json.Unmarshal(output, &response); err != nil {
		writeError(w, http.StatusBadGateway, "native core returned invalid data")
		return
	}
	status := http.StatusOK
	if !response.OK {
		status = http.StatusUnprocessableEntity
	}
	writeJSON(w, status, response)
}

func validateFields(request map[string]any, fields []string) error {
	allowed := map[string]bool{"op": true, "id": true}
	for _, field := range fields {
		allowed[field] = true
		value, exists := request[field]
		if !exists {
			return errors.New("missing required field: " + field)
		}
		if field == "points" {
			if err := validateRegressionPoints(value); err != nil {
				return err
			}
			continue
		}
		number, ok := value.(json.Number)
		if !ok {
			return errors.New(field + " must be numeric")
		}
		parsed, err := number.Float64()
		if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
			return errors.New(field + " must be finite")
		}
	}
	for key := range request {
		if !allowed[key] {
			return errors.New("unexpected field: " + key)
		}
	}
	return nil
}

func validateRegressionPoints(value any) error {
	points, ok := value.([]any)
	if !ok || len(points) < 2 || len(points) > 10_000 {
		return errors.New("points must contain 2 to 10000 coordinate pairs")
	}
	for _, raw := range points {
		pair, ok := raw.([]any)
		if !ok || len(pair) != 2 {
			return errors.New("each point must contain exactly two numbers")
		}
		for _, coordinate := range pair {
			number, ok := coordinate.(json.Number)
			if !ok {
				return errors.New("point coordinates must be numeric")
			}
			parsed, err := number.Float64()
			if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
				return errors.New("point coordinates must be finite")
			}
		}
	}
	return nil
}

func ensureEOF(decoder *json.Decoder) error {
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		return errors.New("trailing JSON data")
	}
	return nil
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
	corePath := strings.TrimSpace(os.Getenv("PRINCIPIA_CORE_BIN"))
	if corePath == "" {
		corePath = "./principia-core-server"
	}
	addr := strings.TrimSpace(os.Getenv("ADDR"))
	if addr == "" {
		addr = ":8080"
	}
	server := &http.Server{
		Addr: addr,
		Handler: (api{corePath: corePath, allowedOrigin: strings.TrimSpace(os.Getenv("ALLOWED_ORIGIN"))}).routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second,
		WriteTimeout: 12 * time.Second,
		IdleTimeout: 60 * time.Second,
	}
	log.Printf("PRINCIPIA Go API listening on %s", addr)
	log.Fatal(server.ListenAndServe())
}
