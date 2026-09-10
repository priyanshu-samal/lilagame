# Game Insights

This analysis focuses on patterns visible in the supplied telemetry dataset and how those patterns could help a Level Designer make better decisions.

## 1. Combat Telemetry Is Overwhelmingly Bot-Driven

### What caught my attention

The telemetry contains a very large difference between bot-related combat events and human combat events.

### Evidence

The dataset contains:

- 2,415 `BotKill` events
- 700 `BotKilled` events
- 3 `Kill` events
- 3 `Killed` events

This means the recorded combat telemetry is dominated by bot interactions.

### Implication

Human and bot combat should be analyzed separately rather than treating all combat events as equivalent.

Useful metrics for future analysis would include:

- Human kills per match
- Human deaths per match
- Bot kills per match
- Bot deaths per match
- Human-vs-bot combat locations
- Combat activity by match phase

### Why a Level Designer should care

If bot encounters dominate the telemetry, an aggregated combat heatmap can give a misleading picture of where meaningful player-vs-player combat happens.

Separating human and bot combat would allow designers to identify areas that actually create player competition and make more informed decisions about:

- POI placement
- Cover
- Chokepoints
- Rotation routes
- High-value combat areas

---

## 2. Movement Data Is Much Richer Than Combat Data

### What caught my attention

The dataset contains substantially more movement telemetry than direct combat events.

### Evidence

The dataset contains:

- 51,347 `Position` events
- 21,712 `BotPosition` events
- 12,885 `Loot` events
- 2,415 `BotKill` events
- 700 `BotKilled` events
- 39 `KilledByStorm` events
- 3 `Kill` events
- 3 `Killed` events

Movement therefore provides a much denser source of information about how the map is actually being traversed.

### Implication

Player traffic should be treated as an important level-design metric in addition to kills and deaths.

Useful metrics include:

- Player traffic by map region
- Frequently visited areas
- Areas with very little traffic
- Loot locations versus player movement
- Entry and exit routes around important POIs
- Movement changes over the course of a match

### Why a Level Designer should care

A map can have areas that are technically accessible but rarely used.

A movement heatmap can expose:

- Underused spaces
- Natural player routes
- Popular rotations
- Traffic bottlenecks
- Areas players consistently avoid

These patterns can guide decisions about traversal, POI placement, loot distribution and map flow.

---

## 3. Storm Deaths Represent a Distinct Failure Pattern

### What caught my attention

Storm deaths are a small but clearly identifiable category of player death in the telemetry.

### Evidence

The dataset contains:

- 39 `KilledByStorm` events

Unlike generic death events, storm deaths can provide information about the relationship between player movement and the playable-zone boundary.

### Implication

Storm deaths should be analyzed spatially and temporally rather than being grouped with combat deaths

Useful metrics include:

- Storm deaths by map region
- Distance from the safe-zone boundary
- Match time when storm deaths occur
- Player routes immediately before storm deaths
- Areas repeatedly associated with late rotations

### Why a Level Designer should care

Repeated storm deaths in a particular region could indicate that players are struggling to rotate through that part of the map.

Depending on the surrounding geometry, this could motivate investigation into:

- Rotation path quality
- Traversal distance
- Chokepoints
- Terrain readability
- POI placement
- Late-game route options

The goal would not be to automatically remove difficult areas, but to identify places where the intended level flow may not match actual player behavior.

---

## Summary

The strongest conclusions from the available telemetry are:

1. **Bot-related combat dominates the recorded combat events**, so human and bot combat should be separated for meaningful combat analysis.
2. **Movement telemetry is the richest source of behavioral information**, making traffic and route analysis especially valuable for Level Design.
3. **Storm deaths form a distinct spatial and temporal failure category** that can be investigated to understand late rotations and map traversal problems.

These insights motivate the core features of the visualization tool: historical replay, player paths, event markers, filtering and heatmaps.