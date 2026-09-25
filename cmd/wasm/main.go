//go:build js && wasm

// Command wasm exposes engine/api to JavaScript as one global function,
// shelfLife(json) → json. It is transport only.
package main

import (
	"crypto/rand"
	"syscall/js"

	"shelflife/engine/api"
)

func main() {
	js.Global().Set("shelfLife", js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) != 1 || args[0].Type() != js.TypeString {
			return `{"error":"expected one JSON request"}`
		}
		return api.Handle(args[0].String(), rand.Reader)
	}))
	select {}
}
