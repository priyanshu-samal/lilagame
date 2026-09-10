'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapId, MAP_CONFIGS } from '@/lib/coordinates';
import { DateOption, MatchSummary, PlayerFilter, VisualizationMode } from '@/lib/types';
import { formatElapsedSeconds } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  Crosshair,
  Users,
  PlayCircle,
  Flame,
  Skull,
  Zap,
  Search,
  ChevronDown,
  Info,
  Layers,
} from 'lucide-react';

interface HeaderControlsProps {
  maps: Record<MapId, any>;
  dates: DateOption[];
  matches: MatchSummary[];
  selectedMap: MapId;
  selectedDate: string;
  selectedMatchId: string;
  playerFilter: PlayerFilter;
  mode: VisualizationMode;
  onSelectMap: (mapId: MapId) => void;
  onSelectDate: (date: string) => void;
  onSelectMatch: (matchId: string) => void;
  onSelectPlayerFilter: (filter: PlayerFilter) => void;
  onSelectMode: (mode: VisualizationMode) => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  maps,
  dates,
  matches,
  selectedMap,
  selectedDate,
  selectedMatchId,
  playerFilter,
  mode,
  onSelectMap,
  onSelectDate,
  onSelectMatch,
  onSelectPlayerFilter,
  onSelectMode,
}) => {
  const [matchSearchOpen, setMatchSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter matches matching selected map & date
  const filteredMatches = matches.filter(
    (m) => m.map === selectedMap && m.date === selectedDate
  );

  // Sort multi-participant matches to top for level designer convenience
  const sortedFilteredMatches = [...filteredMatches].sort((a, b) => {
    if (b.total_players !== a.total_players) {
      return b.total_players - a.total_players;
    }
    return b.duration - a.duration;
  });

  const searchedMatches = sortedFilteredMatches.filter((m) =>
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMatch = matches.find((m) => m.id === selectedMatchId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMatchSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-[#0c1322] border-b border-[#1e293b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm select-none z-30">
      {/* Brand Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md">
          L
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-wider text-sm">
              LILA BLACK
            </span>
            <span className="bg-sky-950/80 text-sky-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-sky-800/60">
              LEVEL DESIGNER TOOL
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Player Journey Telemetry Replay & Heatmaps
          </div>
        </div>
      </div>

      {/* Primary Selectors: Map, Date, Match */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Map Select */}
        <div className="flex items-center bg-[#131d31] border border-[#223354] rounded px-2.5 py-1.5 gap-2">
          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-slate-400 text-[11px] font-medium uppercase">Map:</span>
          <select
            value={selectedMap}
            onChange={(e) => onSelectMap(e.target.value as MapId)}
            className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {Object.entries(MAP_CONFIGS).map(([id, cfg]) => (
              <option key={id} value={id} className="bg-[#0f172a] text-slate-200">
                {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Select */}
        <div className="flex items-center bg-[#131d31] border border-[#223354] rounded px-2.5 py-1.5 gap-2">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-slate-400 text-[11px] font-medium uppercase">Date:</span>
          <select
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {dates.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0f172a] text-slate-200">
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Match Select Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setMatchSearchOpen(!matchSearchOpen)}
            className="flex items-center bg-[#131d31] hover:bg-[#1a2742] border border-[#223354] rounded px-2.5 py-1.5 gap-2 text-left transition-colors min-w-[220px] max-w-[340px]"
          >
            <Crosshair className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="flex-1 truncate">
              <div className="text-[10px] text-slate-400 uppercase font-medium">
                Match ({filteredMatches.length} available):
              </div>
              <div className="text-slate-100 font-mono text-[11px] truncate flex items-center gap-1.5">
                {currentMatch ? (
                  <>
                    <span className="truncate">{currentMatch.id.split('.')[0].slice(0, 8)}...</span>
                    <span className="bg-sky-900/60 text-sky-300 text-[10px] px-1.5 py-0.2 rounded shrink-0">
                      {currentMatch.total_players} {currentMatch.total_players === 1 ? 'player' : 'players'}
                    </span>
                    <span className="text-slate-400 text-[10px] shrink-0">
                      {formatElapsedSeconds(currentMatch.duration)}
                    </span>
                  </>
                ) : (
                  'Select a match...'
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Searchable Match List Dropdown */}
          {matchSearchOpen && (
            <div className="absolute left-0 mt-1 w-80 sm:w-96 bg-[#0f172a] border border-[#334155] rounded-md shadow-2xl z-50 overflow-hidden flex flex-col max-h-[420px]">
              <div className="p-2 border-b border-[#1e293b] bg-[#131d31] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search match ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs w-full focus:outline-none font-mono"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-[#1e293b]/60">
                {searchedMatches.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No matches found for {selectedMap} on this date.
                  </div>
                ) : (
                  searchedMatches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMatch(m.id);
                        setMatchSearchOpen(false);
                      }}
                      className={`w-full p-2 text-left hover:bg-[#1e293b] transition-colors flex items-center justify-between text-xs ${
                        m.id === selectedMatchId ? 'bg-sky-950/60 border-l-2 border-sky-400' : ''
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-mono text-slate-200 font-medium truncate">
                          {m.id}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Dur: {formatElapsedSeconds(m.duration)}</span>
                          <span>•</span>
                          <span>{m.human_count}H / {m.bot_count}B</span>
                          {m.kills > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-red-400 font-semibold">{m.kills} Kills</span>
                            </>
                          )}
                          {m.storm_deaths > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-purple-400">{m.storm_deaths} Storm</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {m.total_players > 1 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/70 text-amber-400 border border-amber-800/60 font-semibold">
                            {m.total_players} players
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            Solo
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Player Type Filter: All / Humans / Bots */}
        <div className="flex items-center bg-[#131d31] border border-[#223354] rounded p-0.5 gap-0.5">
          <button
            onClick={() => onSelectPlayerFilter('all')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              playerFilter === 'all'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onSelectPlayerFilter('humans')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              playerFilter === 'humans'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
            Humans
          </button>
          <button
            onClick={() => onSelectPlayerFilter('bots')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              playerFilter === 'bots'
                ? 'bg-slate-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
            Bots
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-[#131d31] border border-[#223354] rounded p-1 gap-1">
        <button
          onClick={() => onSelectMode('replay')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === 'replay'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Replay
        </button>

        <button
          onClick={() => onSelectMode('traffic')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === 'traffic'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Aggregated player movement heat density"
        >
          <Layers className="w-3.5 h-3.5" />
          Traffic
        </button>

        <button
          onClick={() => onSelectMode('kills')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === 'kills'
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Combat kill hotspots"
        >
          <Flame className="w-3.5 h-3.5" />
          Kills
        </button>

        <button
          onClick={() => onSelectMode('deaths')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === 'deaths'
              ? 'bg-gradient-to-r from-rose-800 to-red-900 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Death locations across all matches"
        >
          <Skull className="w-3.5 h-3.5" />
          Deaths
        </button>

        <button
          onClick={() => onSelectMode('storm')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            mode === 'storm'
              ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Storm casualty choke points"
        >
          <Zap className="w-3.5 h-3.5" />
          Storm
        </button>
      </div>
    </header>
  );
};
