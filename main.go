package main

import (
	"embed"
	"log"
	"wails-template/internal/config"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Create an instance of the app structure
	app := NewApp()

	// Use window configuration from config
	windowWidth := cfg.Window.Width
	windowHeight := cfg.Window.Height

	// Get app title from config
	appTitle := cfg.App.Name

	// Create application with options
	err = wails.Run(&options.App{
		Title:  appTitle,
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
		log.Fatalf("Error starting application: %v", err)
	}
}
