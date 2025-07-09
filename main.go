package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Calculate window size as 2/3 of typical screen size
	// Assuming common screen resolutions (1920x1080, 1366x768, etc.)
	// Using 2/3 of 1920x1080 as default
	windowWidth := int(1920 * 2 / 3)  // ~1280
	windowHeight := int(1080 * 2 / 3) // ~720

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "wails-template",
		Width:  windowWidth,
		Height: windowHeight,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []any{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
