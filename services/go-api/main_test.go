package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"strings"
)


func TestValidateStudyPlanAllowsOptionalContextAndRejectsInvalidValues(t *testing.T) {
	valid := map[string]any{
		"op": "studyPlan", "errorCount": json.Number("2"),
		"energy": json.Number("2"), "confidence": json.Number("4"),
		"goal": "olympiad", "topic": "Mechanics", "phase": "practice",
		"percent": json.Number("86.5"),
	}
	if err := validateFields(valid, operationFields["studyPlan"]); err != nil {
		t.Fatalf("valid study plan rejected: %v", err)
	}
	invalid := []map[string]any{
		{"op":"studyPlan","errorCount":json.Number("0"),"energy":json.Number("4"),"confidence":json.Number("3")},
		{"op":"studyPlan","errorCount":json.Number("0"),"energy":json.Number("2"),"confidence":json.Number("3"),"goal":"hack"},
		{"op":"studyPlan","errorCount":json.Number("0"),"energy":json.Number("2"),"confidence":json.Number("3"),"percent":json.Number("101")},
		{"op":"studyPlan","errorCount":json.Number("0"),"energy":json.Number("2"),"confidence":json.Number("3"),"topic":strings.Repeat("x",121)},
	}
	for _, input := range invalid {
		if err := validateFields(input, operationFields["studyPlan"]); err == nil {
			t.Errorf("expected invalid study plan rejected: %#v", input)
		}
	}
}

func TestValidateScheduleReviewBoundaries(t *testing.T) {
	valid := map[string]any{
		"op":"scheduleReview","quality":json.Number("5"),
		"previousIntervalDays":json.Number("36500"),"easeFactor":json.Number("3.0"),
	}
	if err := validateFields(valid, operationFields["scheduleReview"]); err != nil {
		t.Fatalf("boundary values should pass: %v", err)
	}
	valid["quality"] = json.Number("6")
	if err := validateFields(valid, operationFields["scheduleReview"]); err == nil {
		t.Fatal("quality above 5 should fail")
	}
}

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

func TestValidateFieldsRequiresJSONNumbers(t *testing.T) {
	var request map[string]any
	if err := json.Unmarshal([]byte(`{"op":"velocity","initial":1,"acceleration":2,"seconds":3}`), &request); err != nil {
		t.Fatal(err)
	}
	if err := validateFields(request, operationFields["velocity"]); err == nil {
		t.Fatal("expected json.Unmarshal float64 values to be rejected; API decoder requires json.Number")
	}
}
