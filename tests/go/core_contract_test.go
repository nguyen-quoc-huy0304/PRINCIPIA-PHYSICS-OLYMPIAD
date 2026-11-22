package contract_test

import (
	"encoding/json"
	"os"
	"os/exec"
	"strings"
	"testing"
)

type response struct {
	ID    any             `json:"id"`
	OK    bool            `json:"ok"`
	Value json.RawMessage `json:"value"`
	Error string          `json:"error"`
}

func invokeCore(t *testing.T, request string) response {
	t.Helper()
	bin := os.Getenv("PRINCIPIA_CORE_BIN")
	if bin == "" {
		t.Skip("set PRINCIPIA_CORE_BIN to the compiled principia-core-server binary")
	}
	cmd := exec.Command(bin)
	cmd.Stdin = strings.NewReader(request + "\n")
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("core process failed: %v", err)
	}
	var got response
	if err := json.Unmarshal(out, &got); err != nil {
		t.Fatalf("invalid JSON-line response %q: %v", out, err)
	}
	return got
}

func TestVelocityJSONContract(t *testing.T) {
	got := invokeCore(t, `{"id":"go-1","op":"velocity","initial":3,"acceleration":2,"seconds":4}`)
	if !got.OK || string(got.ID.(string)) != "go-1" {
		t.Fatalf("unexpected response: %+v", got)
	}
	var value float64
	if err := json.Unmarshal(got.Value, &value); err != nil || value != 11 {
		t.Fatalf("expected 11 m/s, got %s (%v)", got.Value, err)
	}
}

func TestRejectsUnknownOperation(t *testing.T) {
	got := invokeCore(t, `{"id":2,"op":"notARealOperation"}`)
	if got.OK || got.Error == "" {
		t.Fatalf("unknown operation must return a structured error: %+v", got)
	}
}

func TestProjectileRangeContract(t *testing.T) {
	got := invokeCore(t, `{"id":3,"op":"projectileRange","speed":10,"angleDeg":45,"gravity":9.81}`)
	if !got.OK {
		t.Fatalf("projectile calculation failed: %+v", got)
	}
	var value float64
	if err := json.Unmarshal(got.Value, &value); err != nil {
		t.Fatal(err)
	}
	const expected = 100.0 / 9.81
	if diff := value - expected; diff < -1e-10 || diff > 1e-10 {
		t.Fatalf("range mismatch: got %.12f, expected %.12f", value, expected)
	}
}
