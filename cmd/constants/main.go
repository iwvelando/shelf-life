// Command constants prints the Library's dimensions as JSON. The website imports
// the output at build time, so its headline figures come from the engine without
// waiting for the WebAssembly download.
package main

import (
	"encoding/json"
	"os"

	"shelflife/engine/stay"
)

func main() {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(stay.Library()); err != nil {
		os.Exit(1)
	}
}
