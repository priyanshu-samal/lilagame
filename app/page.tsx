'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapId, MAP_CONFIGS, validateCoordinateMappingBenchmark } from '@/lib/coordinates';
import {
  ManifestData,
  MatchDetail,
  MatchSummary,
  PlayerFilter,
  VisualizationMode,
  MapHeatmapData,
} from '@/lib/types';
import { HeaderControls } from '@/components/HeaderControls';
import { MapView } from '@/components/MapView';
import { TimelineBar } from '@/components/TimelineBar';
import { MatchSummaryBar } from '@/components/MatchSummaryBar';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(true);

  // Active filters
  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDate, setSelectedDate] = useState<string>('February_10');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [playerFilter, setPlayerFilter] = useState<PlayerFilter>('all');
  const [mode, setMode] = useState<VisualizationMode>('replay');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Active Match Data
  const [currentMatch, setCurrentMatch] = useState<MatchDetail | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Heatmap Data for active map
  const [heatmapData, setHeatmapData] = useState<MapHeatmapData | null>(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Animation frame ref
  const lastFrameTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // 1. Load manifest on mount & run coordinate validation
  useEffect(() => {
    const testResult = validateCoordinateMappingBenchmark();
    if (!testResult.success) {
      console.error('Coordinate benchmark error:', testResult.error);
    } else {
      console.log('Coordinate benchmark validated successfully:', testResult);
    }

    fetch('/data/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ManifestData) => {
        setManifest(data);
        setLoadingManifest(false);

        // Find initial match on AmbroseValley / Feb 10
        const defaultMatches = data.matches.filter(
          (m) => m.map === 'AmbroseValley' && m.date === 'February_10'
        );
        // Prefer multi-participant matches
        const bestDefault = defaultMatches.find((m) => m.total_players > 1) || defaultMatches[0];
        if (bestDefault) {
          setSelectedMatchId(bestDefault.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load manifest.json:', err);
        setLoadingManifest(false);
      });
  }, []);

  // 2. Load Match Telemetry when selectedMatchId changes
  useEffect(() => {
    if (!selectedMatchId) return;

    setLoadingMatch(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setSelectedPlayerId(null);

    fetch(`/data/matches/${selectedMatchId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MatchDetail) => {
        setCurrentMatch(data);
        setLoadingMatch(false);
      })
      .catch((err) => {
        console.error(`Failed to load match ${selectedMatchId}:`, err);
        setLoadingMatch(false);
      });
  }, [selectedMatchId]);

  // 3. Load Heatmap Data when selectedMap changes
  useEffect(() => {
    setLoadingHeatmap(true);
    fetch(`/data/heatmaps/${selectedMap}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MapHeatmapData) => {
        setHeatmapData(data);
        setLoadingHeatmap(false);
      })
      .catch((err) => {
        console.error(`Failed to load heatmap for ${selectedMap}:`, err);
        setLoadingHeatmap(false);
      });
  }, [selectedMap]);

  // 4. Handle Filter Changes (Map / Date auto-selects valid match)
  const handleSelectMap = (newMap: MapId) => {
    setSelectedMap(newMap);
    if (!manifest) return;
    const matchesForNewMap = manifest.matches.filter(
      (m) => m.map === newMap && m.date === selectedDate
    );
    const best = matchesForNewMap.find((m) => m.total_players > 1) || matchesForNewMap[0];
    if (best) {
      setSelectedMatchId(best.id);
    } else {
      // If none on this date, find any date for this map
      const anyMatch = manifest.matches.find((m) => m.map === newMap);
      if (anyMatch) {
        setSelectedDate(anyMatch.date);
        setSelectedMatchId(anyMatch.id);
      }
    }
  };

  const handleSelectDate = (newDate: string) => {
    setSelectedDate(newDate);
    if (!manifest) return;
    const matchesForNewDate = manifest.matches.filter(
      (m) => m.map === selectedMap && m.date === newDate
    );
    const best = matchesForNewDate.find((m) => m.total_players > 1) || matchesForNewDate[0];
    if (best) {
      setSelectedMatchId(best.id);
    }
  };

  // 5. Replay Playback Engine (requestAnimationFrame)
  const duration = currentMatch ? currentMatch.duration : 0;

  const playStep = useCallback(
    (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaSec = (timestamp - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = timestamp;

      setCurrentTime((prevTime) => {
        const nextTime = prevTime + deltaSec * playbackSpeed;
        if (nextTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return nextTime;
      });

      if (isPlaying) {
        animationFrameIdRef.current = requestAnimationFrame(playStep);
      }
    },
    [isPlaying, playbackSpeed, duration]
  );

  useEffect(() => {
    if (isPlaying) {
      lastFrameTimeRef.current = performance.now();
      animationFrameIdRef.current = requestAnimationFrame(playStep);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      lastFrameTimeRef.current = null;
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, playStep]);

  // Play/Pause toggle
  const handlePlayToggle = () => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  // Seek handler
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Rewind
  const handleRewind = () => {
    setCurrentTime(0);
  };

  if (loadingManifest) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="font-semibold text-sm">Loading LILA BLACK Telemetry Data...</span>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-slate-200">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="w-6 h-6" />
          <span>Error loading manifest data.</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100">
      {/* 1. Top Header with Primary Selectors & Visualization Mode Tabs */}
      <HeaderControls
        maps={manifest.maps}
        dates={manifest.dates}
        matches={manifest.matches}
        selectedMap={selectedMap}
        selectedDate={selectedDate}
        selectedMatchId={selectedMatchId}
        playerFilter={playerFilter}
        mode={mode}
        onSelectMap={handleSelectMap}
        onSelectDate={handleSelectDate}
        onSelectMatch={setSelectedMatchId}
        onSelectPlayerFilter={setPlayerFilter}
        onSelectMode={setMode}
      />

      {/* 2. Dominant Map Visualization Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {loadingMatch && (
          <div className="absolute inset-0 bg-[#090d16]/70 backdrop-blur-xs flex items-center justify-center z-30 pointer-events-none">
            <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-md px-4 py-2 text-xs text-sky-300 shadow-xl">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Loading match telemetry...</span>
            </div>
          </div>
        )}

        <MapView
          mapId={selectedMap}
          match={currentMatch}
          heatmapData={heatmapData}
          currentTime={currentTime}
          playerFilter={playerFilter}
          mode={mode}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
        />
      </div>

      {/* 3. Replay Timeline HUD (visible in Replay Mode) */}
      {mode === 'replay' && currentMatch && (
        <TimelineBar
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          timelineEvents={currentMatch.timeline}
          onPlayToggle={handlePlayToggle}
          onSeek={handleSeek}
          onSpeedChange={setPlaybackSpeed}
          onRewind={handleRewind}
        />
      )}

      {/* 4. Compact Summary Bar */}
      <MatchSummaryBar
        match={currentMatch}
        selectedPlayerId={selectedPlayerId}
        onSelectPlayer={setSelectedPlayerId}
      />
    </main>
  );
}
