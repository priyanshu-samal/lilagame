'use client';

import React from 'react';
import { MatchDetail } from '@/lib/types';
import { formatElapsedSeconds } from '@/lib/utils';
import { Users, Bot, Crosshair, Skull, Zap, Gem, Clock, ShieldAlert } from 'lucide-react';

interface MatchSummaryBarProps {
  match: MatchDetail | null;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}

export const MatchSummaryBar: React.FC<MatchSummaryBarProps> = ({
  match,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  if (!match) return null;

  const { stats } = match;

  return (
    <div className="w-full bg-[#0d1424] border-t border-[#1e293b] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
      {/* Left: Match Key Statistics */}
      <div className="flex items-center flex-wrap gap-4">
        {/* Duration */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Duration:</span>
          <span className="font-mono font-semibold text-slate-100">
            {formatElapsedSeconds(match.duration)}
          </span>
        </div>

        {/* Players (Humans + Bots) */}
        <div className="flex items-center gap-2 border-l border-[#1e293b] pl-3">
          <div className="flex items-center gap-1 text-sky-300">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold">{stats.human_count}</span>
            <span className="text-slate-400 text-[11px]">Humans</span>
          </div>

          <span className="text-slate-600">/</span>

          <div className="flex items-center gap-1 text-slate-300">
            <Bot className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold">{stats.bot_count}</span>
            <span className="text-slate-400 text-[11px]">Bots</span>
          </div>
        </div>

        {/* Combat: Kills & Deaths */}
        <div className="flex items-center gap-3 border-l border-[#1e293b] pl-3">
          <div className="flex items-center gap-1 text-red-400" title="Total Kills (PvP + Bot)">
            <Crosshair className="w-3.5 h-3.5 text-red-400" />
            <span className="font-bold">{stats.kill_count}</span>
            <span className="text-slate-400 text-[11px]">Kills</span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({stats.pvp_kill_count} PvP / {stats.bot_kill_count} Bot)
            </span>
          </div>

          <div className="flex items-center gap-1 text-rose-400" title="Total Casualties">
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold">{stats.death_count}</span>
            <span className="text-slate-400 text-[11px]">Deaths</span>
          </div>

          {stats.storm_death_count > 0 && (
            <div className="flex items-center gap-1 text-purple-400" title="Deaths to the Closing Storm">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold">{stats.storm_death_count}</span>
              <span className="text-slate-400 text-[11px]">Storm</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-amber-300" title="Item Pickups">
            <Gem className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{stats.loot_count}</span>
            <span className="text-slate-400 text-[11px]">Loot</span>
          </div>
        </div>
      </div>

      {/* Right: Selected Player Focus Pill / Roster selector */}
      <div className="flex items-center gap-2">
        {selectedPlayerId ? (
          <div className="flex items-center gap-1.5 bg-sky-950/80 border border-sky-700/80 rounded px-2.5 py-1 text-sky-200 text-xs">
            <span>Tracking:</span>
            <span className="font-mono font-semibold truncate max-w-[140px]">
              {selectedPlayerId.slice(0, 8)}...
            </span>
            <button
              onClick={() => onSelectPlayer(null)}
              className="text-slate-400 hover:text-white font-bold ml-1 px-1 rounded hover:bg-sky-900"
              title="Show all participants"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">
            Displaying all {match.players.length} participant trajectories
          </span>
        )}
      </div>
    </div>
  );
};
