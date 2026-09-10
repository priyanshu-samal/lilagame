# LILA BLACK — Player Journey Explorer

An interactive telemetry visualization tool for Level Designers at LILA Games.

The tool transforms raw LILA BLACK gameplay telemetry into an interactive map-based experience for exploring player movement, combat, deaths, loot activity, storm deaths, and match progression.

## Live Demo

**Deployment:**  
[ADD YOUR DEPLOYED VERCEL / NETLIFY URL HERE]

---

## What This Tool Does

The Player Journey Explorer allows a Level Designer to inspect how players actually move through LILA BLACK maps.

Instead of inspecting raw telemetry data, the designer can:

- View player journeys directly on the game minimap
- Distinguish human players from bots
- Replay a match over time
- Inspect kills, deaths, loot, and storm deaths
- Filter by map, date, and match
- Filter between humans and bots
- View traffic heatmaps
- View combat/kill heatmaps
- View death heatmaps
- View storm-death locations

The goal is to make gameplay telemetry understandable visually and help Level Designers identify movement patterns, combat hotspots, underused areas, and potential gameplay problems.

---

## Features

### Match Replay

Select a map, date, and match to reconstruct the match from the underlying player/bot journeys.

The replay timeline allows the designer to:

- Play
- Pause
- Seek through the match
- Change playback speed
- Observe player movement over time
- Observe events at their corresponding timestamps

### Player Journeys

Player movement is rendered directly on top of the supplied minimap images.

Humans and bots use visually different representations.

### Event Visualization

The following telemetry events are visualized:

- Kill
- Killed
- BotKill
- BotKilled
- Loot
- KilledByStorm

### Heatmaps

The tool provides aggregate spatial views for:

- Traffic
- Kills / Combat
- Deaths
- Storm deaths

These allow a designer to analyze behavior beyond a single match.

### Filters

The application supports filtering by:

- Map
- Date
- Match
- Player type

Player type can be:

- All
- Humans
- Bots

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Web application and deployment |
| React | UI components and application state |
| TypeScript | Type safety and maintainability |
| Canvas | Rendering player trajectories and map overlays efficiently |
| Python | Preprocessing the supplied Parquet telemetry |
| JSON | Serving preprocessed match and heatmap data to the browser |
| WebP | Optimized minimap assets |

---

## Architecture

The raw telemetry is processed before being consumed by the browser.

```text
Raw Parquet telemetry
        |
        v
Python preprocessing
        |
        +--> Match data
        |
        +--> Player journeys
        |
        +--> Timeline events
        |
        +--> Heatmap data
        |
        v
Static JSON assets
        |
        v
Next.js application
        |
        v
Canvas visualization
        |
        v
Level Designer