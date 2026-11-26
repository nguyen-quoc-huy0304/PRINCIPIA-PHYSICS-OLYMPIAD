package main

import (
	"net/http"
	"sort"
)

type operationCapability struct {
	Required []string `json:"required"`
	Optional []string `json:"optional,omitempty"`
}

func (a api) capabilities(w http.ResponseWriter, r *http.Request) {
	operations := make(map[string]operationCapability, len(operationFields))
	names := make([]string, 0, len(operationFields))
	for name := range operationFields {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		required := append([]string(nil), operationFields[name]...)
		optional := append([]string(nil), optionalStringFields[name]...)
		optional = append(optional, optionalNumericFields[name]...)
		sort.Strings(required)
		sort.Strings(optional)
		operations[name] = operationCapability{Required: required, Optional: optional}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"service": "principia-go-api",
		"nativeCore": a.corePath != "",
		"operations": operations,
	})
}
