package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const (
	maxAIRequestBytes = 24 << 10
	maxAIMessages = 18
	maxAITextBytes = 8 << 10
)

type aiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type aiRequest struct {
	System   string      `json:"system"`
	Messages []aiMessage `json:"messages"`
}

type firebaseLookupResponse struct {
	Users []struct {
		LocalID string `json:"localId"`
		Disabled bool  `json:"disabled"`
	} `json:"users"`
}

func validAIText(value string, max int) bool {
	return strings.TrimSpace(value) != "" && len(value) <= max
}

func normalizeAIRequest(input aiRequest) ([]map[string]any, error) {
	if !validAIText(input.System, 6000) {
		return nil, errors.New("invalid system instruction")
	}
	if len(input.Messages) < 1 || len(input.Messages) > maxAIMessages {
		return nil, errors.New("message count is outside supported limits")
	}
	contents := make([]map[string]any, 0, len(input.Messages))
	for _, message := range input.Messages {
		if (message.Role != "user" && message.Role != "assistant") || !validAIText(message.Content, maxAITextBytes) {
			return nil, errors.New("invalid chat message")
		}
		role := "user"
		if message.Role == "assistant" {
			role = "model"
		}
		contents = append(contents, map[string]any{
			"role": role,
			"parts": []map[string]string{{"text": strings.TrimSpace(message.Content)}},
		})
	}
	return contents, nil
}

func (a api) generateAI(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxAIRequestBytes)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input aiRequest
	if err := decoder.Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid AI request")
		return
	}
	if err := ensureEOF(decoder); err != nil {
		writeError(w, http.StatusBadRequest, "request must contain one JSON object")
		return
	}
	contents, err := normalizeAIRequest(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	client := &http.Client{Timeout: 12 * time.Second}
	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	defer cancel()
	if err := verifyFirebaseBearer(ctx, client, r.Header.Get("Authorization")); err != nil {
		writeError(w, http.StatusUnauthorized, "session expired or invalid")
		return
	}
	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if apiKey == "" {
		writeError(w, http.StatusServiceUnavailable, "AI provider is not configured")
		return
	}
	model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if model == "" {
		model = "gemini-3.5-flash-lite"
	}
	endpoint := "https://generativelanguage.googleapis.com/v1beta/models/" + url.PathEscape(model) + ":generateContent"
	payload := map[string]any{
		"systemInstruction": map[string]any{"parts": []map[string]string{{"text": strings.TrimSpace(input.System)}}},
		"contents": contents,
		"generationConfig": map[string]any{"temperature": 0.5, "maxOutputTokens": 1400},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not encode AI request")
		return
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create AI request")
		return
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("x-goog-api-key", apiKey)
	response, err := client.Do(request)
	if err != nil {
		writeError(w, http.StatusBadGateway, "AI provider is temporarily unavailable")
		return
	}
	defer response.Body.Close()
	resultBody, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		writeError(w, http.StatusBadGateway, "could not read AI provider response")
		return
	}
	if response.StatusCode == http.StatusTooManyRequests {
		writeError(w, http.StatusTooManyRequests, "AI quota exceeded; retry later")
		return
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		writeError(w, http.StatusBadGateway, "AI provider rejected the request")
		return
	}
	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct { Text string `json:"text"` } `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(resultBody, &result); err != nil {
		writeError(w, http.StatusBadGateway, "AI provider returned invalid data")
		return
	}
	var answer strings.Builder
	if len(result.Candidates) > 0 {
		for _, part := range result.Candidates[0].Content.Parts {
			answer.WriteString(part.Text)
		}
	}
	if strings.TrimSpace(answer.String()) == "" {
		writeError(w, http.StatusBadGateway, "AI provider returned an empty answer")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"answer": strings.TrimSpace(answer.String()),
		"provider": "Google Gemini",
		"model": model,
	})
}

func verifyFirebaseBearer(ctx context.Context, client *http.Client, authorization string) error {
	parts := strings.Fields(authorization)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || len(parts[1]) > 5000 {
		return errors.New("missing bearer token")
	}
	apiKey := strings.TrimSpace(os.Getenv("FIREBASE_WEB_API_KEY"))
	if apiKey == "" {
		return errors.New("Firebase API key is not configured")
	}
	endpoint := "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + url.QueryEscape(apiKey)
	body, _ := json.Marshal(map[string]string{"idToken": parts[1]})
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil { return err }
	request.Header.Set("Content-Type", "application/json")
	response, err := client.Do(request)
	if err != nil { return err }
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK { return errors.New("Firebase token rejected") }
	var result firebaseLookupResponse
	if err := json.NewDecoder(io.LimitReader(response.Body, 64<<10)).Decode(&result); err != nil { return err }
	if len(result.Users) != 1 || result.Users[0].LocalID == "" || result.Users[0].Disabled {
		return errors.New("Firebase user is invalid")
	}
	return nil
}
