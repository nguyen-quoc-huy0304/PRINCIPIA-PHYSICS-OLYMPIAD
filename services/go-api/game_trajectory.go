package main

import (
	"encoding/json"
	"errors"
	"io"
	"math"
	"net/http"
)

const maxTrajectoryRequestBytes = 8 << 10

type trajectoryRequest struct {
	SpeedMps float64 `json:"speedMps"`
	AngleDeg float64 `json:"angleDeg"`
	GravityMps2 float64 `json:"gravityMps2"`
	Samples int `json:"samples"`
}

type trajectoryPoint struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type trajectoryResponse struct {
	FlightTimeS float64 `json:"flightTimeS"`
	RangeM float64 `json:"rangeM"`
	MaxHeightM float64 `json:"maxHeightM"`
	Points []trajectoryPoint `json:"points"`
}

func calculateTrajectory(input trajectoryRequest) (trajectoryResponse, error) {
	if !finiteTrajectoryInputs(input) || input.SpeedMps <= 0 || input.GravityMps2 <= 0 || input.AngleDeg < 0 || input.AngleDeg > 90 || input.Samples < 2 || input.Samples > 512 {
		return trajectoryResponse{}, errors.New("invalid trajectory parameters")
	}
	angle := input.AngleDeg * math.Pi / 180
	vx, vy := input.SpeedMps*math.Cos(angle), input.SpeedMps*math.Sin(angle)
	flight := 2 * vy / input.GravityMps2
	rangeM := vx * flight
	height := vy * vy / (2 * input.GravityMps2)
	if !allFinite(flight, rangeM, height) { return trajectoryResponse{}, errors.New("derived values overflow") }
	points := make([]trajectoryPoint, input.Samples)
	for i := range points {
		t := flight * float64(i) / float64(input.Samples-1)
		x, y := vx*t, vy*t-0.5*input.GravityMps2*t*t
		if !allFinite(x, y) { return trajectoryResponse{}, errors.New("trajectory overflow") }
		points[i] = trajectoryPoint{X: x, Y: y}
	}
	return trajectoryResponse{FlightTimeS: flight, RangeM: rangeM, MaxHeightM: height, Points: points}, nil
}

func finiteTrajectoryInputs(input trajectoryRequest) bool {
	return allFinite(input.SpeedMps, input.AngleDeg, input.GravityMps2)
}

func allFinite(values ...float64) bool {
	for _, value := range values { if math.IsNaN(value) || math.IsInf(value, 0) { return false } }
	return true
}

func gameTrajectoryHandler(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxTrajectoryRequestBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input trajectoryRequest
	if err := decoder.Decode(&input); err != nil { writeError(w, http.StatusBadRequest, "invalid trajectory request"); return }
	if err := decoder.Decode(new(any)); !errors.Is(err, io.EOF) { writeError(w, http.StatusBadRequest, "request must contain one JSON object"); return }
	result, err := calculateTrajectory(input)
	if err != nil { writeError(w, http.StatusUnprocessableEntity, err.Error()); return }
	writeJSON(w, http.StatusOK, result)
}
