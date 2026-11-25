package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthEndpoint(t *testing.T) {
	server := httptest.NewServer((api{}).routes())
	defer server.Close()
	response, err := http.Get(server.URL + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.StatusCode)
	}
}

func TestComputeRejectsUnknownOperation(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/v1/compute", bytes.NewBufferString(`{"op":"dropDatabase"}`))
	response := httptest.NewRecorder()
	(api{}).compute(response, request)
	if response.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", response.Code)
	}
}

func TestComputeRejectsNonFiniteAndUnknownFields(t *testing.T) {
	cases := []string{
		`{"op":"velocity","initial":1e999,"acceleration":1,"seconds":2}`,
		`{"op":"velocity","initial":1,"acceleration":1,"seconds":2,"admin":true}`,
		`{"op":"velocity","initial":1,"acceleration":"2","seconds":2}`,
	}
	for _, body := range cases {
		request := httptest.NewRequest(http.MethodPost, "/v1/compute", bytes.NewBufferString(body))
		response := httptest.NewRecorder()
		(api{}).compute(response, request)
		if response.Code != http.StatusUnprocessableEntity {
			t.Errorf("body %s: expected 422, got %d", body, response.Code)
		}
	}
}

func TestComputeRejectsTrailingJSON(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/v1/compute", bytes.NewBufferString(`{"op":"velocity","initial":1,"acceleration":1,"seconds":2} {}`))
	response := httptest.NewRecorder()
	(api{}).compute(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", response.Code)
	}
}

func TestValidateFieldsAcceptsValidRequest(t *testing.T) {
	var request map[string]any
	if err := json.Unmarshal([]byte(`{"op":"velocity","initial":1,"acceleration":2,"seconds":3}`), &request); err != nil {
		t.Fatal(err)
	}
	if err := validateFields(request, operationFields["velocity"]); err == nil {
		t.Fatal("expected json.Unmarshal float64 values to be rejected; API decoder requires json.Number")
	}
}
