# Player Journey Visualization Tool

A browser-based telemetry visualization tool for LILA BLACK Level Designers.

The tool reconstructs historical player journeys from telemetry data and displays them on the correct game minimap. It supports player movement, human/bot identification, gameplay events, match filtering, replay playback, and heatmaps.

## Live Demo

**Deployed App:**  
https://lilagame.vercel.app/

**GitHub Repository:**  
https://github.com/priyanshu-samal/lilagame

---

## Overview

This project was built to help Level Designers understand how players actually move through a game map.

Instead of looking at raw telemetry rows, the application converts historical telemetry into a visual representation:

- Player movement paths
- Human vs Bot players
- Kills
- Deaths
- Storm deaths
- Loot events
- Match timeline
- Replay playback
- Kill/death/traffic heatmaps
- Map, date and match filtering

The application focuses on turning telemetry into something that can be explored visually and used for level-design analysis.

---

## Features

### 1. Match Selection

Users can filter telemetry by:

- Map
- Date
- Match
- Player type

Available maps:

- Ambrose Valley
- Grand Rift
- Lockdown

---

### 2. Player Journeys

Player movement is rendered directly on the supplied minimap.

Each player's historical path is reconstructed from their position telemetry.

The application uses the game's X/Z world coordinates for the 2D map.

---

### 3. Human vs Bot

The source data identifies:

- Humans using UUID-style player IDs
- Bots using short numeric IDs

The interface allows players to be distinguished between human and bot participants.

---

### 4. Gameplay Events

The following telemetry events are visualized:

- Kill
- Killed
- BotKill
- BotKilled
- KilledByStorm
- Loot

Events appear on the map at their corresponding world coordinates and timeline position.

---

### 5. Replay / Timeline

A match can be played back chronologically.

The timeline allows the user to:

- Play
- Pause
- Scrub through the match
- See player positions change over time
- See events appear as they occur

This reconstructs the historical match rather than showing live gameplay.

---

### 6. Heatmaps

The application supports heatmap visualization for aggregated movement and event activity.

This helps identify areas with:

- High player traffic
- Concentrated activity
- Combat activity
- Death activity
- Other repeated player behavior

---

## Dataset

The supplied telemetry contains data from February 10–14, 2026.

The processed dataset contains approximately:

- 89,104 telemetry records
- 796 matches
- 339 unique players
- 3 maps

The source files are Apache Parquet files without a `.parquet` extension.

Each filename follows the structure:

`{user_id}_{match_id}.nakama-0`

A complete match is reconstructed by combining all files belonging to the same `match_id` and sorting their telemetry chronologically.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- HTML Canvas
- Tailwind CSS
- Lucide React

### Data Processing

- Python
- Pandas
- PyArrow

### Deployment

The frontend is designed to run as a static/client-side visualization using preprocessed JSON data.

---

## Architecture

The application uses a preprocessing + visualization architecture.

```text
Raw Parquet Telemetry
        |
        v
Python Processing Pipeline
        |
        +---- Match JSON
        +---- Manifest JSON
        +---- Heatmap Data
        +---- Optimized Minimap Images
        |
        v
Next.js / React Application
        |
        v
Canvas Visualization
        |
        +---- Player Paths
        +---- Player Positions
        +---- Events
        +---- Timeline
        +---- Heatmaps

The raw telemetry is processed before being consumed by the browser.

This avoids parsing thousands of Parquet files in the browser and keeps the frontend focused on visualization and interaction.

Coordinate Mapping

The telemetry provides world coordinates.

For the 2D map, the application uses:

x → horizontal world coordinate
z → vertical/depth world coordinate
y → elevation and is not used for the 2D map projection

Each map has its own coordinate configuration.

Ambrose Valley
scale = 900
origin_x = -370
origin_z = -473
Grand Rift
scale = 581
origin_x = -290
origin_z = -290
Lockdown
scale = 1000
origin_x = -500
origin_z = -500

World coordinates are converted to normalized UV coordinates:

u = (x - origin_x) / scale
v = (z - origin_z) / scale

The normalized coordinates are then converted to image pixels:

pixel_x = u * image_width
pixel_y = (1 - v) * image_height

The Y inversion is required because world/map coordinates and image pixel coordinates use opposite vertical directions.

The coordinate conversion is implemented centrally in:

lib/coordinates.ts

Timestamp Handling

The source README describes the timestamp field as milliseconds.

During analysis of the actual telemetry values, the timestamps behaved like Unix seconds.

For example, values around:

1770754537

correspond to February 2026 when interpreted as Unix seconds.

Consecutive timestamps also commonly differ by values such as 5, 10 or 20, which produces realistic movement intervals when interpreted as seconds.

Therefore the application treats the timestamp unit as seconds for match reconstruction and displays elapsed match time as:

MM:SS

Wall-clock timestamps are not shown as the primary replay timeline.

Project Structure
app/
  page.tsx
  globals.css
  layout.tsx

components/
  HeaderControls.tsx
  MapView.tsx
  TimelineBar.tsx
  MatchSummaryBar.tsx

lib/
  coordinates.ts
  types.ts
  utils.ts

scripts/
  process_data.py
  optimize_images.py

public/
  data/
    manifest.json
    matches/
  minimaps/
Setup
Requirements

Install:

Node.js
npm
Python 3.10+
Install Frontend Dependencies
npm ci

Run the development server:

npm run dev

Open:

http://localhost:3000
Build for Production

Run:

npm run build

Then:

npm start
Data Processing

The Python preprocessing pipeline converts the supplied Parquet telemetry into browser-friendly JSON.

The processing pipeline:

Reads the telemetry files.
Groups files by match ID.
Decodes event data.
Normalizes timestamps.
Sorts telemetry chronologically.
Reconstructs player journeys.
Extracts gameplay events.
Generates heatmap data.
Writes match-level JSON.
Generates a manifest used by the frontend.

The resulting files are stored under:

public/data/
Environment Variables

No environment variables are required for the current application.

All visualization data required by the deployed frontend is served from the project's public data directory.

How to Use
Step 1

Select a map from the top controls.

Step 2

Select a date.

Step 3

Select a match.

Step 4

The selected match is rendered on its corresponding minimap.

Step 5

Use the timeline to move through the match.

Step 6

Press play to watch the match unfold.

Step 7

Use the visualization modes to inspect movement and event patterns.

Step 8

Use the heatmap view to understand repeated activity across telemetry.

Design Decisions
Why Canvas?

Canvas was chosen because the visualization can contain many paths, points and animated markers.

It also provides direct control over:

Rendering
Animation
Coordinate projection
Heatmaps
Player markers
Why preprocess the Parquet data?

Parsing thousands of Parquet files directly in the browser would add unnecessary complexity and increase client-side work.

Preprocessing produces compact JSON specifically shaped for the visualization.

Why keep coordinate conversion separate?

Map coordinate conversion is a core correctness requirement.

Keeping it in a dedicated module prevents different components from implementing slightly different coordinate calculations.

Limitations

The current implementation is optimized for the supplied assignment dataset.

Potential future improvements include:

More advanced spatial clustering
More detailed player comparison
Clickable event markers
More sophisticated heatmap aggregation
Larger-scale telemetry support
Server-side querying for very large datasets
Additional level-design metrics
Walkthrough

A typical analysis workflow is:

Select Map
   ↓
Select Date
   ↓
Select Match
   ↓
Inspect Player Paths
   ↓
Play / Scrub Timeline
   ↓
Inspect Events
   ↓
Enable Heatmap
   ↓
Identify Spatial Patterns
   ↓
Use Findings for Level Design Decisions

The main goal is to make historical telemetry understandable without requiring the Level Designer to manually inspect raw telemetry files.
