# Architecture

## 1. What Was Built

The Player Journey Visualization Tool is a browser-based telemetry analysis application for LILA BLACK Level Designers.

It converts raw player telemetry into a visual representation of historical matches, allowing designers to inspect player movement, gameplay events and aggregated activity on the supplied minimaps.

The system is split into two main stages:

1. Offline data preprocessing
2. Browser-based visualization

---

## 2. Technology Stack

| Technology | Purpose | Why |
|---|---|---|
| Next.js | Frontend application | Provides a structured React application and production deployment support |
| React | UI components | Component-based interface for filters, timeline and match information |
| TypeScript | Application logic | Type safety for telemetry and visualization data |
| HTML Canvas | Map rendering | Efficient rendering of paths, markers, animations and heatmaps |
| Tailwind CSS | UI styling | Fast implementation of the application interface |
| Python | Data preprocessing | Efficient processing of the supplied telemetry dataset |
| Pandas | Data transformation | Grouping, sorting and transforming telemetry records |
| PyArrow | Parquet processing | Reads the supplied Parquet telemetry files |

---

## 3. Data Flow

```text
Raw Parquet Files
        |
        v
Python Preprocessing
        |
        +------------------+
        |                  |
        v                  v
Match JSON           Heatmap Data
        |
        +------------------+
        |
        v
Manifest JSON
        |
        v
Next.js / React
        |
        v
Canvas Map Renderer
        |
        +---- Player Paths
        +---- Player Positions
        +---- Events
        +---- Heatmaps
        +---- Replay Timeline

The Python pipeline processes the raw telemetry before the application is used.

The browser therefore consumes visualization-ready JSON rather than having to parse the original Parquet dataset.

This reduces browser-side processing and keeps the frontend focused on interaction and rendering.

4. Match Reconstruction

The supplied telemetry is distributed across many files.

Each filename follows:

{user_id}_{match_id}.nakama-0

Files belonging to the same match_id are combined to reconstruct the complete match.

Telemetry records are then sorted chronologically using their timestamp.

The resulting match data contains:

Players
Position samples
Gameplay events
Event timestamps
Player type
Match duration

This reconstructed structure is written as match-level JSON files under:

public/data/matches/
5. Coordinate Mapping

The telemetry contains 3D world coordinates:

x = horizontal world position
y = elevation
z = depth / vertical map position

For the 2D minimap visualization, x and z are used.

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

World coordinates are first converted to normalized UV coordinates:

u = (x - origin_x) / scale
v = (z - origin_z) / scale

They are then converted to image pixels:

pixel_x = u * image_width
pixel_y = (1 - v) * image_height

The vertical coordinate is inverted because image coordinates increase downward while the map/world coordinate system increases upward.

The coordinate conversion is centralized in:

lib/coordinates.ts

This prevents different visualization components from implementing inconsistent coordinate transformations.

6. Timestamp Handling

The source documentation describes the timestamp field as milliseconds.

However, inspection of the actual telemetry values showed that the values behave like Unix timestamps in seconds.

For example:

1770754537

corresponds to February 2026 when interpreted as Unix seconds.

The differences between consecutive samples also commonly appear as values such as 5, 10 or 20, which produce realistic movement intervals when interpreted as seconds.

The application therefore treats timestamps as seconds for match reconstruction.

Replay time is represented as elapsed match time:

MM:SS

rather than displaying the raw timestamp.

7. Rendering Strategy

The minimap and telemetry visualization are rendered using HTML Canvas.

Canvas was selected because the application needs to render:

Multiple player paths
Player position markers
Gameplay event markers
Animated replay positions
Heatmap layers

During playback, the current player position is interpolated between nearby telemetry samples to create smoother movement rather than jumping directly between recorded points.

8. Heatmap Strategy

Heatmaps aggregate telemetry spatially instead of displaying individual samples.

The visualization can represent repeated activity such as player movement and event locations.

This allows a Level Designer to move from:

Individual Player Journey

to:

Repeated Spatial Pattern

The heatmap data is generated during preprocessing so that the browser does not need to repeatedly process the complete raw dataset.

9. Key Tradeoffs
Decision	Tradeoff
Preprocess Parquet into JSON	Faster browser experience, but data must be regenerated when source telemetry changes
Canvas rendering	Good rendering performance and animation control, but less convenient than DOM/SVG for individual element interaction
Client-side match visualization	Simple deployment and low infrastructure requirements, but very large datasets would eventually benefit from server-side querying
Precomputed heatmap data	Faster visualization, but less flexible for arbitrary future aggregation queries
Match-level JSON files	Easy to load individual matches, but creates many generated files
10. Assumptions

The implementation makes the following assumptions based on the supplied dataset:

x and z represent the relevant 2D world coordinates.
y represents elevation and is not required for the 2D minimap.
Human player IDs are UUID-style identifiers.
Bot player IDs are short numeric identifiers.
All telemetry files belonging to the same match_id represent the same historical match.
Telemetry timestamps are treated as Unix seconds based on their observed values.
The supplied minimaps correspond to the coordinate configurations provided with the dataset.
The current dataset size is suitable for preprocessed JSON and browser-side visualization.
11. Why This Architecture

The main architectural goal was to keep the system simple enough to build and deploy within the assignment timeframe while still separating responsibilities clearly.

Python handles:

Raw data parsing
Match reconstruction
Event extraction
Heatmap preparation

Next.js/React handles:

Filtering
Match selection
Timeline interaction
Playback
Visualization

Canvas handles:

Map rendering
Player paths
Player markers
Events
Heatmaps

This separation makes the system easier to understand, test and extend.