package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCapabilitiesEndpointListsSchemas(t *testing.T) {
	server := httptest.NewServer((api{}).routes())
	defer server.Close()
	response, err := http.Get(server.URL + "/v1/capabilities")
	if err != nil { t.Fatal(err) }
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK { t.Fatalf("expected 200, got %d", response.StatusCode) }
	var payload struct {
		Service string `json:"service"`
		NativeCore bool `json:"nativeCore"`
		Operations map[string]operationCapability `json:"operations"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil { t.Fatal(err) }
	if payload.Service != "principia-go-api" { t.Fatalf("unexpected service: %s", payload.Service) }
	if _, exists := payload.Operations["linearRegression"]; !exists { t.Fatal("linearRegression schema missing") }
	study, exists := payload.Operations["studyPlan"]
	if !exists { t.Fatal("studyPlan schema missing") }
	if len(study.Required) != 3 || len(study.Optional) != 4 { t.Fatalf("unexpected studyPlan schema: %#v", study) }
}

func TestCapabilitiesEndpointRejectsNonGet(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/v1/capabilities", nil)
	response := httptest.NewRecorder()
	(api{}).routes().ServeHTTP(response, request)
	if response.Code != http.StatusMethodNotAllowed { t.Fatalf("expected 405, got %d", response.Code) }
}
