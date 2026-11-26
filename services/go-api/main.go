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
	coreSlots    chan struct{}
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
	"studyPlan": {"errorCount", "energy", "confidence"},
	"scheduleReview": {"quality", "previousIntervalDays", "easeFactor"},
	"gradeQuiz": {"questions", "passPercent"},
}


var optionalStringFields = map[string][]string{
	"studyPlan": {"goal", "phase", "topic"},
}

var optionalNumericFields = map[string][]string{
	"studyPlan": {"percent"},
}

var stringValues = map[string]map[string]map[string]bool{
	"studyPlan": {
		"goal": {"understand": true, "remember": true, "solve": true, "olympiad": true, "teach": true, "recover": true},
	},
}


func (a api) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "principia-go-api"})
	})
	mux.HandleFunc("POST /v1/compute", a.compute)
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
	if a.coreSlots != nil {
		select {
		case a.coreSlots <- struct{}{}:
			defer func() { <-a.coreSlots }()
		case <-ctx.Done():
			writeError(w, http.StatusGatewayTimeout, "native core queue timed out")
			return
		}
	}
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
	op, _ := request["op"].(string)
	allowed := map[string]bool{"op": true, "id": true}
	for _, field := range fields { allowed[field] = true }
	for _, field := range optionalStringFields[op] { allowed[field] = true }
	for _, field := range optionalNumericFields[op] { allowed[field] = true }

	for _, field := range fields {
		value, exists := request[field]
		if !exists { return errors.New("missing required field: " + field) }
		if err := validateNumericField(field, value); err != nil { return err }
	}
	for _, field := range optionalNumericFields[op] {
		value, exists := request[field]
		if exists && value != nil {
			if err := validateNumericField(field, value); err != nil { return err }
		}
	}
	for _, field := range optionalStringFields[op] {
		value, exists := request[field]
		if !exists || value == nil { continue }
		str, ok := value.(string)
		if !ok || len(str) > 120 { return errors.New(field + " must be a string of at most 120 bytes") }
		if choices, hasChoices := stringValues[op][field]; hasChoices && str != "" && !choices[str] {
			return errors.New("unsupported " + field + " value")
		}
	}
	switch op {
	case "studyPlan":
		if err := validateIntegerRange(request["energy"], "energy", 1, 3); err != nil { return err }
		if err := validateIntegerRange(request["confidence"], "confidence", 1, 5); err != nil { return err }
		if err := validateIntegerRange(request["errorCount"], "errorCount", 0, int64(1<<32 - 1)); err != nil { return err }
		if value, exists := request["percent"]; exists && value != nil {
			n := value.(json.Number); v, err := n.Float64()
			if err != nil || math.IsNaN(v) || math.IsInf(v, 0) || v < 0 || v > 100 { return errors.New("percent must be between 0 and 100") }
		}
	case "gradeQuiz":
		if err := validateQuizQuestions(request["questions"]); err != nil { return err }
		if err := validatePercent(request["passPercent"]); err != nil { return err }
	case "scheduleReview":
		if err := validateIntegerRange(request["quality"], "quality", 0, 5); err != nil { return err }
		if err := validateIntegerRange(request["previousIntervalDays"], "previousIntervalDays", 0, 36500); err != nil { return err }
		n := request["easeFactor"].(json.Number); v, err := n.Float64()
		if err != nil || math.IsNaN(v) || math.IsInf(v, 0) || v < 1.3 || v > 3.0 { return errors.New("easeFactor must be between 1.3 and 3.0") }
	}
	for key := range request {
		if !allowed[key] { return errors.New("unexpected field: " + key) }
	}
	return nil
}


func validatePercent(value any) error {
	number, ok := value.(json.Number)
	if !ok { return errors.New("passPercent must be numeric") }
	parsed, err := number.Float64()
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) || parsed < 0 || parsed > 100 {
		return errors.New("passPercent must be between 0 and 100")
	}
	return nil
}

func validateQuizQuestions(value any) error {
	questions, ok := value.([]any)
	if !ok || len(questions) == 0 || len(questions) > 500 {
		return errors.New("questions must contain between 1 and 500 entries")
	}
	seen := make(map[string]struct{}, len(questions))
	for index, raw := range questions {
		question, ok := raw.(map[string]any)
		if !ok || len(question) != 5 {
			return errors.New("each question must contain exactly id, selectedIndex, correctIndex, optionCount and points")
		}
		id, ok := question["id"].(string)
		if !ok || strings.TrimSpace(id) == "" || len(id) > 128 {
			return errors.New("question id must be a non-empty string of at most 128 bytes")
		}
		if _, exists := seen[id]; exists { return errors.New("duplicate question id") }
		seen[id] = struct{}{}
		optionCount, err := quizIndex(question["optionCount"], "optionCount")
		if err != nil || optionCount < 2 || optionCount > 16 { return errors.New("optionCount must be between 2 and 16") }
		selected, err := quizIndex(question["selectedIndex"], "selectedIndex")
		if err != nil || selected >= optionCount { return errors.New("selectedIndex is outside the option range") }
		correct, err := quizIndex(question["correctIndex"], "correctIndex")
		if err != nil || correct >= optionCount { return errors.New("correctIndex is outside the option range") }
		points, ok := question["points"].(json.Number)
		if !ok { return errors.New("question points must be numeric") }
		parsed, err := points.Float64()
		if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) || parsed <= 0 || parsed > 1_000_000 {
			return errors.New("question points must be finite and between 0 and 1000000")
		}
		_ = index
	}
	return nil
}

func quizIndex(value any, field string) (int64, error) {
	number, ok := value.(json.Number)
	if !ok { return 0, errors.New(field + " must be an integer") }
	parsed, err := number.Int64()
	if err != nil || parsed < 0 { return 0, errors.New(field + " must be a non-negative integer") }
	return parsed, nil
}

func validateIntegerRange(value any, field string, min, max int64) error {
	number, ok := value.(json.Number)
	if !ok { return errors.New(field + " must be an integer") }
	parsed, err := number.Int64()
	if err != nil || parsed < min || parsed > max { return errors.New(field + " is out of range") }
	return nil
}

func validateNumericField(field string, value any) error {
	if field == "points" {
		points, ok := value.([]any)
		if !ok || len(points) < 2 || len(points) > 10000 { return errors.New("points must contain between 2 and 10000 pairs") }
		for _, raw := range points {
			pair, ok := raw.([]any)
			if !ok || len(pair) != 2 { return errors.New("each point must contain exactly two numbers") }
			for _, rawCoordinate := range pair {
				number, ok := rawCoordinate.(json.Number)
				if !ok { return errors.New("point coordinates must be numeric") }
				parsed, err := number.Float64()
				if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) { return errors.New("point coordinates must be finite") }
			}
		}
		return nil
	}
	number, ok := value.(json.Number)
	if !ok { return errors.New(field + " must be numeric") }
	parsed, err := number.Float64()
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) { return errors.New(field + " must be finite") }
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
		Handler: (api{corePath: corePath, allowedOrigin: strings.TrimSpace(os.Getenv("ALLOWED_ORIGIN")), coreSlots: make(chan struct{}, 4)}).routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second,
		WriteTimeout: 12 * time.Second,
		IdleTimeout: 60 * time.Second,
	}
	log.Printf("PRINCIPIA Go API listening on %s", addr)
	log.Fatal(server.ListenAndServe())
}
