'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { MapId, MAP_CONFIGS, worldToUV, uvToPixel, mapPixelToWorld } from '@/lib/coordinates';
import {
  MatchDetail,
  PlayerFilter,
  VisualizationMode,
  MapHeatmapData,
  PlayerJourney,
  TimelineEvent,
  TrajectoryPoint,
} from '@/lib/types';
import { EVENT_VISUALS, PLAYER_COLORS, formatElapsedSeconds } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Sliders,
  Compass,
} from 'lucide-react';

interface MapViewProps {
  mapId: MapId;
  match: MatchDetail | null;
  heatmapData: MapHeatmapData | null;
  currentTime: number;
  playerFilter: PlayerFilter;
  mode: VisualizationMode;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

interface TooltipInfo {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  details: { label: string; value: string }[];
}

export const MapView: React.FC<MapViewProps> = ({
  mapId,
  match,
  heatmapData,
  currentTime,
  playerFilter,
  mode,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Heatmap settings
  const [heatmapRadius, setHeatmapRadius] = useState(24);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.85);

  // Hover & Tooltip
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; z: number; u: number; v: number } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Legend visibility toggle
  const [showLegend, setShowLegend] = useState(true);

  // Load minimap image
  const [imageLoaded, setImageLoaded] = useState(false);
  const config = MAP_CONFIGS[mapId];

  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.src = config.image;
    img.onload = () => {
      mapImageRef.current = img;
      setImageLoaded(true);
    };
  }, [config.image]);

  // Reset zoom and pan
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.3, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.3, 0.7));

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const nextZoom = Math.max(0.7, Math.min(8, zoom * zoomFactor));

    // Keep point under cursor stable
    setPan((prevPan) => ({
      x: mouseX - (mouseX - prevPan.x) * (nextZoom / zoom),
      y: mouseY - (mouseY - prevPan.y) * (nextZoom / zoom),
    }));
    setZoom(nextZoom);
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Calculate hover world coordinates
    const container = containerRef.current;
    if (!container || !imageLoaded) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const mapDisplaySize = Math.min(rect.width, rect.height);
    const offsetX = (rect.width - mapDisplaySize) / 2;
    const offsetY = (rect.height - mapDisplaySize) / 2;

    // Invert zoom and pan
    const canvasX = (clientX - pan.x - offsetX) / zoom;
    const canvasY = (clientY - pan.y - offsetY) / zoom;

    if (canvasX >= 0 && canvasX <= mapDisplaySize && canvasY >= 0 && canvasY <= mapDisplaySize) {
      const u = canvasX / mapDisplaySize;
      const v = 1 - canvasY / mapDisplaySize;
      const worldPos = mapPixelToWorld(mapId, canvasX, canvasY, mapDisplaySize, mapDisplaySize);

      setHoveredCoords({
        x: Math.round(worldPos.x * 10) / 10,
        z: Math.round(worldPos.z * 10) / 10,
        u: Math.round(u * 1000) / 1000,
        v: Math.round(v * 1000) / 1000,
      });

      // Check for hover on event markers or players
      if (mode === 'replay' && match) {
        checkMarkerHover(canvasX, canvasY, mapDisplaySize, e.clientX, e.clientY);
      } else {
        setTooltip(null);
      }
    } else {
      setHoveredCoords(null);
      setTooltip(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Interpolate player position at currentTime
  const getPlayerStateAtTime = useCallback(
    (journey: PlayerJourney, time: number) => {
      const path = journey.path;
      if (!path || path.length === 0) return null;

      // Before first point
      if (time < path[0][0]) return null;

      // After last point
      if (time >= path[path.length - 1][0]) {
        const last = path[path.length - 1];
        return {
          u: last[3],
          v: last[4],
          x: last[1],
          z: last[2],
          angle: 0,
        };
      }

      // Find surrounding samples for visual linear interpolation
      // [rel_ts, x, z, u, v]
      let idx = 0;
      while (idx < path.length - 1 && path[idx + 1][0] <= time) {
        idx++;
      }

      const p0 = path[idx];
      const p1 = path[idx + 1];

      const t0 = p0[0];
      const t1 = p1[0];
      const dt = t1 - t0;
      const frac = dt > 0 ? (time - t0) / dt : 0;

      const u = p0[3] + (p1[3] - p0[3]) * frac;
      const v = p0[4] + (p1[4] - p0[4]) * frac;
      const x = p0[1] + (p1[1] - p0[1]) * frac;
      const z = p0[2] + (p1[2] - p0[2]) * frac;

      // Calculate movement angle
      const dx = p1[3] - p0[3];
      const dy = -(p1[4] - p0[4]); // inverted Y in screen space
      const angle = Math.atan2(dy, dx);

      return { u, v, x, z, angle };
    },
    []
  );

  // Check hover on event markers or players for tooltip
  const checkMarkerHover = (
    canvasX: number,
    canvasY: number,
    mapDisplaySize: number,
    screenX: number,
    screenY: number
  ) => {
    if (!match) return;

    const hitRadius = 14 / zoom;

    // Check discrete events that have occurred up to currentTime
    const visibleEvents = match.timeline.filter((ev) => ev.t <= currentTime);
    for (let i = visibleEvents.length - 1; i >= 0; i--) {
      const ev = visibleEvents[i];
      if (playerFilter === 'humans' && ev.is_bot) continue;
      if (playerFilter === 'bots' && !ev.is_bot) continue;

      const px = ev.u * mapDisplaySize;
      const py = (1 - ev.v) * mapDisplaySize;
      const dist = Math.hypot(canvasX - px, canvasY - py);

      if (dist <= hitRadius) {
        const visual = EVENT_VISUALS[ev.type];
        setTooltip({
          x: screenX + 15,
          y: screenY - 10,
          title: visual.label,
          subtitle: ev.is_bot ? `Bot: ${ev.user_id}` : `Player: ${ev.user_id.slice(0, 8)}...`,
          details: [
            { label: 'Timestamp', value: formatElapsedSeconds(ev.t) },
            { label: 'Event', value: ev.type },
            { label: 'World Coords', value: `X: ${ev.x}, Z: ${ev.z}` },
            { label: 'UV', value: `u: ${ev.u}, v: ${ev.v}` },
          ],
        });
        return;
      }
    }

    // Check active players
    for (const journey of match.players) {
      if (playerFilter === 'humans' && journey.is_bot) continue;
      if (playerFilter === 'bots' && !journey.is_bot) continue;

      const state = getPlayerStateAtTime(journey, currentTime);
      if (!state) continue;

      const px = state.u * mapDisplaySize;
      const py = (1 - state.v) * mapDisplaySize;
      const dist = Math.hypot(canvasX - px, canvasY - py);

      if (dist <= hitRadius) {
        setTooltip({
          x: screenX + 15,
          y: screenY - 10,
          title: journey.is_bot ? 'AI Bot' : 'Human Player',
          subtitle: journey.id,
          details: [
            { label: 'Match Time', value: formatElapsedSeconds(currentTime) },
            { label: 'Coordinates', value: `X: ${state.x.toFixed(1)}, Z: ${state.z.toFixed(1)}` },
            { label: 'UV', value: `u: ${state.u.toFixed(3)}, v: ${state.v.toFixed(3)}` },
          ],
        });
        return;
      }
    }

    setTooltip(null);
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = mapImageRef.current;
    if (!canvas || !container || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Keep square aspect ratio for minimap
    const mapDisplaySize = Math.min(width, height);
    const offsetX = (width - mapDisplaySize) / 2;
    const offsetY = (height - mapDisplaySize) / 2;

    // Apply Pan and Zoom Transform
    ctx.save();
    ctx.translate(pan.x + offsetX, pan.y + offsetY);
    ctx.scale(zoom, zoom);

    // 1. Draw Base Minimap Image
    ctx.drawImage(img, 0, 0, mapDisplaySize, mapDisplaySize);

    // Subtle grid overlay for level designer reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1 / zoom;
    const gridStep = mapDisplaySize / 10;
    for (let g = 0; g <= mapDisplaySize; g += gridStep) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, mapDisplaySize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(mapDisplaySize, g);
      ctx.stroke();
    }

    // 2. Render Telemetry based on Mode
    if (mode === 'replay' && match) {
      renderReplayMode(ctx, mapDisplaySize);
    } else if (heatmapData) {
      renderHeatmapMode(ctx, mapDisplaySize);
    }

    ctx.restore();
    ctx.restore();
  }, [
    imageLoaded,
    zoom,
    pan,
    mode,
    match,
    currentTime,
    playerFilter,
    selectedPlayerId,
    heatmapData,
    heatmapRadius,
    heatmapOpacity,
    getPlayerStateAtTime,
  ]);

  // Render Replay Mode: Paths, Animated Players, Event Glyphs
  const renderReplayMode = (ctx: CanvasRenderingContext2D, mapDisplaySize: number) => {
    if (!match) return;

    // 1. Draw Trajectory Paths
    match.players.forEach((journey) => {
      if (playerFilter === 'humans' && journey.is_bot) return;
      if (playerFilter === 'bots' && !journey.is_bot) return;

      const isSelected = selectedPlayerId === journey.id;
      const path = journey.path;
      if (!path || path.length < 2) return;

      // Filter points up to currentTime
      const activePoints = path.filter((p) => p[0] <= currentTime);
      if (activePoints.length === 0) return;

      const isHuman = !journey.is_bot;
      const strokeColor = isHuman ? '#38bdf8' : '#94a3b8';

      // Draw faint full-journey trail for context
      ctx.beginPath();
      ctx.strokeStyle = isHuman ? 'rgba(56, 189, 248, 0.18)' : 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = (isSelected ? 2.5 : 1.2) / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);

      path.forEach((pt, idx) => {
        const px = pt[3] * mapDisplaySize;
        const py = (1 - pt[4]) * mapDisplaySize;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw active solid trail up to current replay timestamp
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? '#ffffff' : strokeColor;
      ctx.lineWidth = (isSelected ? 3.5 : isHuman ? 2.2 : 1.6) / zoom;

      activePoints.forEach((pt, idx) => {
        const px = pt[3] * mapDisplaySize;
        const py = (1 - pt[4]) * mapDisplaySize;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });

      // Connect to current interpolated position
      const curState = getPlayerStateAtTime(journey, currentTime);
      if (curState) {
        ctx.lineTo(curState.u * mapDisplaySize, (1 - curState.v) * mapDisplaySize);
      }
      ctx.stroke();
    });

    // 2. Draw Discrete Event Markers (Kills, Deaths, Loot, Storm Deaths)
    const visibleEvents = match.timeline.filter((ev) => ev.t <= currentTime);

    visibleEvents.forEach((ev) => {
      if (playerFilter === 'humans' && ev.is_bot) return;
      if (playerFilter === 'bots' && !ev.is_bot) return;

      const px = ev.u * mapDisplaySize;
      const py = (1 - ev.v) * mapDisplaySize;
      const visual = EVENT_VISUALS[ev.type];

      // Draw distinct marker shape
      drawEventMarker(ctx, px, py, ev.type, visual.color, zoom);
    });

    // 3. Draw Active Player Tokens at Current Timestamp
    match.players.forEach((journey) => {
      if (playerFilter === 'humans' && journey.is_bot) return;
      if (playerFilter === 'bots' && !journey.is_bot) return;

      const state = getPlayerStateAtTime(journey, currentTime);
      if (!state) return;

      const px = state.u * mapDisplaySize;
      const py = (1 - state.v) * mapDisplaySize;
      const isSelected = selectedPlayerId === journey.id;
      const isHuman = !journey.is_bot;

      const radius = (isSelected ? 6.5 : isHuman ? 5 : 4) / zoom;

      // Glow halo for selected or human players
      if (isSelected || isHuman) {
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? 'rgba(255, 255, 255, 0.4)'
          : isHuman
          ? 'rgba(56, 189, 248, 0.35)'
          : 'rgba(148, 163, 184, 0.2)';
        ctx.fill();
      }

      // Player circle token
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : isHuman ? '#0284c7' : '#64748b';
      ctx.fill();
      ctx.lineWidth = 1.8 / zoom;
      ctx.strokeStyle = isSelected ? '#38bdf8' : isHuman ? '#38bdf8' : '#94a3b8';
      ctx.stroke();

      // Heading indicator arrow
      if (state.angle !== 0) {
        const arrowLen = (radius + 4) / zoom;
        const tipX = px + Math.cos(state.angle) * arrowLen;
        const tipY = py + Math.sin(state.angle) * arrowLen;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#38bdf8';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      }
    });
  };

  // Draw distinct shape for each event type
  const drawEventMarker = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: string,
    color: string,
    currentZoom: number
  ) => {
    const size = 6.5 / currentZoom;

    ctx.save();
    ctx.translate(x, y);

    if (type === 'Kill' || type === 'BotKill') {
      // Crosshair / Combat Star
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2 / currentZoom;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-size * 1.5, 0);
      ctx.lineTo(size * 1.5, 0);
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(0, size * 1.5);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'Killed' || type === 'BotKilled') {
      // Skull / Death marker (X with background circle)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 / currentZoom;
      ctx.beginPath();
      ctx.moveTo(-size, -size);
      ctx.lineTo(size, size);
      ctx.moveTo(size, -size);
      ctx.lineTo(-size, size);
      ctx.stroke();
    } else if (type === 'KilledByStorm') {
      // Storm Death: Purple Hazard Diamond with glow
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.6);
      ctx.lineTo(size * 1.4, 0);
      ctx.moveTo(0, size * 1.6);
      ctx.lineTo(-size * 1.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2 / currentZoom;
      ctx.stroke();
    } else if (type === 'Loot') {
      // Loot: Gold Diamond
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.2);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size * 1.2);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 / currentZoom;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Render Aggregate Heatmaps (Traffic, Kills, Deaths, Storm)
  const renderHeatmapMode = (ctx: CanvasRenderingContext2D, mapDisplaySize: number) => {
    if (!heatmapData) return;

    // Pick points according to current mode and player filter
    let points: [number, number][] = [];
    let colorPalette: { r: number; g: number; b: number }[] = [];

    if (mode === 'traffic') {
      if (playerFilter === 'all') {
        points = [...heatmapData.traffic_human, ...heatmapData.traffic_bot];
      } else if (playerFilter === 'humans') {
        points = heatmapData.traffic_human;
      } else {
        points = heatmapData.traffic_bot;
      }
      // Traffic ramp: Cyan -> Green -> Yellow -> Red -> White
      colorPalette = [
        { r: 14, g: 165, b: 233 },  // sky-500
        { r: 16, g: 185, b: 129 },  // emerald-500
        { r: 234, g: 179, b: 8 },   // amber-500
        { r: 239, g: 68, b: 68 },   // red-500
        { r: 255, g: 255, b: 255 }, // white
      ];
    } else if (mode === 'kills') {
      points = heatmapData.kills.map((k) => [k[0], k[1]]);
      // Combat ramp: Amber -> Orange -> Bright Red
      colorPalette = [
        { r: 245, g: 158, b: 11 },
        { r: 239, g: 68, b: 68 },
        { r: 185, g: 28, b: 28 },
        { r: 255, g: 255, b: 255 },
      ];
    } else if (mode === 'deaths') {
      points = heatmapData.deaths.map((d) => [d[0], d[1]]);
      // Death ramp: Rose -> Crimson -> Deep Red
      colorPalette = [
        { r: 244, g: 63, b: 94 },
        { r: 225, g: 29, b: 72 },
        { r: 159, g: 18, b: 57 },
      ];
    } else if (mode === 'storm') {
      points = heatmapData.storm_deaths;
      // Storm ramp: Violet -> Electric Purple -> Magenta
      colorPalette = [
        { r: 168, g: 85, b: 247 },
        { r: 192, g: 132, b: 252 },
        { r: 244, g: 114, b: 182 },
      ];
    }

    if (points.length === 0) return;

    // Generate offscreen density buffer for smooth gaussian splats
    const offscreen = document.createElement('canvas');
    offscreen.width = mapDisplaySize;
    offscreen.height = mapDisplaySize;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const r = (heatmapRadius * mapDisplaySize) / 1024;

    // Draw radial alpha gradients for each point
    offCtx.fillStyle = 'rgba(0,0,0,1)';
    points.forEach(([u, v]) => {
      const px = u * mapDisplaySize;
      const py = (1 - v) * mapDisplaySize;

      const grad = offCtx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, 'rgba(0,0,0,0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      offCtx.fillStyle = grad;
      offCtx.fillRect(px - r, py - r, r * 2, r * 2);
    });

    // Colorize offscreen buffer
    const imgData = offCtx.getImageData(0, 0, mapDisplaySize, mapDisplaySize);
    const data = imgData.data;
    const pLen = colorPalette.length;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const norm = Math.min(1, alpha / 180);
        const idx = Math.min(pLen - 1, Math.floor(norm * (pLen - 1)));
        const nextIdx = Math.min(pLen - 1, idx + 1);
        const frac = (norm * (pLen - 1)) - idx;

        const c1 = colorPalette[idx];
        const c2 = colorPalette[nextIdx];

        data[i] = c1.r + (c2.r - c1.r) * frac;
        data[i + 1] = c1.g + (c2.g - c1.g) * frac;
        data[i + 2] = c1.b + (c2.b - c1.b) * frac;
        data[i + 3] = Math.min(255, alpha * heatmapOpacity * 1.5);
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    // Draw colorized heatmap onto main canvas
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 w-full h-full bg-[#080c14] overflow-hidden select-none cursor-crosshair"
    >
      {/* HTML5 Interactive Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating Zoom & Viewport Controls (Top Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-[#0f172a]/90 backdrop-blur-sm border border-[#1e293b] rounded p-1 shadow-lg z-20">
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-[#1e293b] text-slate-300 hover:text-white rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-[#1e293b] text-slate-300 hover:text-white rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 hover:bg-[#1e293b] text-slate-300 hover:text-white rounded transition-colors"
          title="Reset Zoom & Center View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="border-t border-[#1e293b] my-0.5" />
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-1.5 hover:bg-[#1e293b] rounded transition-colors ${
            showLegend ? 'text-sky-400' : 'text-slate-500'
          }`}
          title={showLegend ? 'Hide Legend' : 'Show Legend'}
        >
          {showLegend ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Coordinate Inspector (Top Left) */}
      <div className="absolute top-3 left-3 bg-[#0f172a]/85 backdrop-blur-sm border border-[#1e293b] rounded px-2.5 py-1.5 text-[11px] font-mono shadow-md z-20 pointer-events-none">
        <div className="flex items-center gap-2 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-200 font-semibold">{config.name}</span>
          <span>•</span>
          <span>Scale: {config.scale}</span>
        </div>
        {hoveredCoords ? (
          <div className="flex items-center gap-3 text-slate-300 mt-0.5">
            <span>
              World: <strong className="text-sky-300">X: {hoveredCoords.x}</strong>,{' '}
              <strong className="text-sky-300">Z: {hoveredCoords.z}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span>
              UV: u:{hoveredCoords.u}, v:{hoveredCoords.v}
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 mt-0.5">
            Hover over map for world coordinates
          </div>
        )}
      </div>

      {/* Heatmap Slider Controls (in Heatmap modes) */}
      {mode !== 'replay' && (
        <div className="absolute bottom-3 right-3 bg-[#0f172a]/90 backdrop-blur-sm border border-[#1e293b] rounded p-2.5 shadow-xl text-xs z-20 flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center justify-between font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Heatmap Settings
            </span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Radius:</span>
              <span className="font-mono text-sky-400">{heatmapRadius}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={heatmapRadius}
              onChange={(e) => setHeatmapRadius(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Opacity:</span>
              <span className="font-mono text-sky-400">{Math.round(heatmapOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Interactive Legend (Bottom Left) */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 bg-[#0f172a]/90 backdrop-blur-sm border border-[#1e293b] rounded p-2.5 shadow-xl text-xs z-20 max-w-[260px]">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Visual Legend</span>
            <span className="text-[9px] text-slate-500 font-normal">Level Designer Key</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            {/* Human vs Bot */}
            <div className="flex items-center gap-1.5 text-sky-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] border border-white/60"></span>
              <span>Human Player</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] border border-white/40"></span>
              <span>AI Bot</span>
            </div>

            {/* Combat events */}
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="text-sm leading-none font-bold">✦</span>
              <span>PvP Kill</span>
            </div>

            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="text-sm leading-none font-bold">☠</span>
              <span>Death</span>
            </div>

            <div className="flex items-center gap-1.5 text-orange-400">
              <span className="text-sm leading-none font-bold">⚔</span>
              <span>Bot Kill</span>
            </div>

            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="text-sm leading-none font-bold">⚡</span>
              <span>Storm Death</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300 col-span-2">
              <span className="text-sm leading-none font-bold">◆</span>
              <span>Item Looted</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none bg-[#090e1a]/95 border border-[#334155] rounded shadow-2xl p-2.5 text-xs z-50 min-w-[180px] max-w-[260px]"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="font-bold text-slate-100">{tooltip.title}</div>
          <div className="text-[11px] text-slate-400 font-mono truncate mb-1">
            {tooltip.subtitle}
          </div>
          <div className="border-t border-[#1e293b] pt-1 flex flex-col gap-0.5">
            {tooltip.details.map((d, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-slate-400">{d.label}:</span>
                <span className="font-mono text-sky-300">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
