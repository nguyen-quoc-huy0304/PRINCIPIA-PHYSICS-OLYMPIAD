package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestParseSymbolsNormalizesAndDeduplicates(t *testing.T) {
	got, err := parseSymbols("fpt, VCB,FPT")
	if err != nil { t.Fatal(err) }
	if len(got) != 2 || got[0] != "FPT" || got[1] != "VCB" {
		t.Fatalf("unexpected symbols: %#v", got)
	}
}

func TestParseSymbolsRejectsInvalidInput(t *testing.T) {
	for _, input := range []string{"", "F/PT", "TOOLONGSYMBOL", "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U"} {
		if _, err := parseSymbols(input); err == nil {
			t.Errorf("expected %q to be rejected", input)
		}
	}
}

func TestHealthReportsProviderConfiguration(t *testing.T) {
	s := &server{}
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()
	s.routes().ServeHTTP(response, request)
	if response.Code != http.StatusOK { t.Fatalf("status = %d", response.Code) }
	body := response.Body.String()
	for _, expected := range []string{`"stocks":false`, `"fx":true`, `"realEstate":false`} {
		if !contains(body, expected) { t.Errorf("health response missing %s: %s", expected, body) }
	}
}

func TestStockEndpointRequiresProviderCredentials(t *testing.T) {
	s := &server{}
	request := httptest.NewRequest(http.MethodGet, "/v1/market/stocks?symbols=FPT", nil)
	response := httptest.NewRecorder()
	s.routes().ServeHTTP(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusServiceUnavailable)
	}
}

func TestFXRejectsMalformedCurrency(t *testing.T) {
	s := &server{}
	request := httptest.NewRequest(http.MethodGet, "/v1/market/fx?base=US1", nil)
	response := httptest.NewRecorder()
	s.routes().ServeHTTP(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}

func contains(value, part string) bool {
	return len(value) >= len(part) && indexOf(value, part) >= 0
}
func indexOf(value, part string) int {
	for i := 0; i+len(part) <= len(value); i++ {
		if value[i:i+len(part)] == part { return i }
	}
	return -1
}
