package main

import (
	"bytes"
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCalculateTrajectoryLandingAndBounds(t *testing.T) {
	result, err := calculateTrajectory(trajectoryRequest{SpeedMps: 20, AngleDeg: 45, GravityMps2: 9.80665, Samples: 49})
	if err != nil { t.Fatal(err) }
	if len(result.Points) != 49 { t.Fatalf("expected 49 points, got %d", len(result.Points)) }
	if result.Points[0] != (trajectoryPoint{X: 0, Y: 0}) { t.Fatalf("trajectory must start at origin: %+v", result.Points[0]) }
	last := result.Points[len(result.Points)-1]
	if math.Abs(last.Y) > 1e-10 || math.Abs(last.X-result.RangeM) > 1e-10 { t.Fatalf("trajectory must land at range: %+v", last) }
}

func TestCalculateTrajectoryRejectsInvalidInputs(t *testing.T) {
	cases := []trajectoryRequest{
		{SpeedMps: -1, AngleDeg: 45, GravityMps2: 9.8, Samples: 10},
		{SpeedMps: 10, AngleDeg: 91, GravityMps2: 9.8, Samples: 10},
		{SpeedMps: 10, AngleDeg: 45, GravityMps2: 0, Samples: 10},
		{SpeedMps: 10, AngleDeg: 45, GravityMps2: 9.8, Samples: 1},
		{SpeedMps: 10, AngleDeg: 45, GravityMps2: 9.8, Samples: 513},
		{SpeedMps: math.NaN(), AngleDeg: 45, GravityMps2: 9.8, Samples: 10},
	}
	for _, input := range cases { if _, err := calculateTrajectory(input); err == nil { t.Fatalf("expected invalid input: %+v", input) } }
}

func TestTrajectoryHandlerValidatesRequest(t *testing.T) {
	body, _ := json.Marshal(trajectoryRequest{SpeedMps: 15, AngleDeg: 30, GravityMps2: 9.8, Samples: 20})
	req := httptest.NewRequest(http.MethodPost, "/v1/game/trajectory", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	gameTrajectoryHandler(rec, req)
	if rec.Code != http.StatusOK { t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String()) }
}

func TestTrajectoryHandlerRejectsUnknownFieldsAndTrailingJSON(t *testing.T) {
	for _, body := range []string{
		`{"speedMps":10,"angleDeg":45,"gravityMps2":9.8,"samples":10,"extra":1}`,
		`{"speedMps":10,"angleDeg":45,"gravityMps2":9.8,"samples":10} {}`,
	} {
		req := httptest.NewRequest(http.MethodPost, "/v1/game/trajectory", bytes.NewBufferString(body))
		rec := httptest.NewRecorder()
		gameTrajectoryHandler(rec, req)
		if rec.Code != http.StatusBadRequest { t.Errorf("expected 400, got %d", rec.Code) }
	}
}
