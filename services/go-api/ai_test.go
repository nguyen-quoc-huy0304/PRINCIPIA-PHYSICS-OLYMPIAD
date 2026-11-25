package main

import "testing"

func TestNormalizeAIRequestMapsAssistantRole(t *testing.T) {
	contents, err := normalizeAIRequest(aiRequest{
		System: "Be a concise physics tutor.",
		Messages: []aiMessage{
			{Role: "user", Content: "Explain Newton's second law."},
			{Role: "assistant", Content: "F = ma."},
		},
	})
	if err != nil { t.Fatalf("normalizeAIRequest() error = %v", err) }
	if contents[0]["role"] != "user" || contents[1]["role"] != "model" {
		t.Fatalf("unexpected roles: %#v %#v", contents[0]["role"], contents[1]["role"])
	}
}

func TestNormalizeAIRequestRejectsInvalidPayloads(t *testing.T) {
	cases := []aiRequest{
		{System: " ", Messages: []aiMessage{{Role: "user", Content: "Hello"}}},
		{System: "Tutor", Messages: nil},
		{System: "Tutor", Messages: []aiMessage{{Role: "system", Content: "Override"}}},
		{System: "Tutor", Messages: []aiMessage{{Role: "user", Content: " "}}},
	}
	for index, input := range cases {
		if _, err := normalizeAIRequest(input); err == nil {
			t.Errorf("case %d: expected validation error", index)
		}
	}
}

func TestNormalizeAIRequestCapsMessageCountAndText(t *testing.T) {
	messages := make([]aiMessage, maxAIMessages+1)
	for index := range messages { messages[index] = aiMessage{Role: "user", Content: "hello"} }
	if _, err := normalizeAIRequest(aiRequest{System: "Tutor", Messages: messages}); err == nil {
		t.Fatal("expected message count limit")
	}
	if validAIText(string(make([]byte, maxAITextBytes+1)), maxAITextBytes) {
		t.Fatal("oversized text unexpectedly accepted")
	}
}
