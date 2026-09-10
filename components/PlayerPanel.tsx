'use client';

import React from 'react';
import { MatchDetail } from '@/lib/types';
import { formatElapsedSeconds } from '@/lib/utils';
import { User, Bot, Crosshair, Skull, Zap, Gem, X } from 'lucide-react';

interface PlayerPanelProps {
  match: MatchDetail;
  selectedPlayerId: string | null;
  currentTime: number;
  onSelectPlayer: (id: string | null) => void;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  match, selectedPlayerId, currentTime, onSelectPlayer,
}) => {
  const { stats, players } = match;

  // Separate humans/bots, sort humans first
  const sorted = [...players].sort((a, b) => {
    if (a.is_bot !== b.is_bot) return a.is_bot ? 1 : -1;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="flex flex-col h-full bg-[#07090f] border-l border-[#151f35] w-48 xl:w-52 shrink-0 overflow-hidden">
      {/* Match Stats header */}
      <div className="px-3 py-2 border-b border-[#151f35] bg-[#09101c]">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Match</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div className="text-slate-400">Duration</div>
          <div className="font-mono text-slate-200 text-right">{formatElapsedSeconds(match.duration)}</div>

          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
            Humans
          </div>
          <div className="font-mono text-sky-300 text-right">{stats.human_count}</div>

          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
            Bots
          </div>
          <div className="font-mono text-slate-300 text-right">{stats.bot_count}</div>
        </div>

        {/* Combat quick stats */}
        <div className="mt-2 flex items-center gap-2 text-[10px] flex-wrap">
          {stats.kill_count > 0 && (
            <span className="flex items-center gap-0.5 text-red-400">
              <Crosshair className="w-2.5 h-2.5" />{stats.kill_count}
            </span>
          )}
          {stats.death_count > 0 && (
            <span className="flex items-center gap-0.5 text-rose-400">
              <Skull className="w-2.5 h-2.5" />{stats.death_count}
            </span>
          )}
          {stats.storm_death_count > 0 && (
            <span className="flex items-center gap-0.5 text-purple-400">
              <Zap className="w-2.5 h-2.5" />{stats.storm_death_count}
            </span>
          )}
          {stats.loot_count > 0 && (
            <span className="flex items-center gap-0.5 text-amber-400">
              <Gem className="w-2.5 h-2.5" />{stats.loot_count}
            </span>
          )}
        </div>
      </div>

      {/* Player Roster */}
      <div className="px-3 pt-2 pb-1 border-b border-[#151f35]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Participants ({players.length})
          </span>
          {selectedPlayerId && (
            <button
              onClick={() => onSelectPlayer(null)}
              className="text-[10px] text-slate-500 hover:text-sky-400 flex items-center gap-0.5 transition-colors"
            >
              <X className="w-2.5 h-2.5" /> All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.map(player => {
          const isSelected = selectedPlayerId === player.id;
          const isHuman = !player.is_bot;

          // Check if player was active at currentTime
          const lastPathPoint = player.path.length > 0
            ? player.path[player.path.length - 1]
            : null;
          const isActive = lastPathPoint ? currentTime <= lastPathPoint[0] + 30 && currentTime >= (player.path[0]?.[0] ?? 0) : false;

          // Count events up to currentTime
          const eventsNow = player.events.filter(e => e[0] <= currentTime).length;

          return (
            <button
              key={player.id}
              onClick={() => onSelectPlayer(isSelected ? null : player.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-all border-b border-[#0e1525]/50 ${
                isSelected
                  ? 'bg-sky-950/80 border-l-2 border-sky-400'
                  : 'hover:bg-[#0f1828] border-l-2 border-transparent'
              } ${selectedPlayerId && !isSelected ? 'opacity-40' : ''}`}
            >
              {/* Player type indicator */}
              <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                isHuman ? 'bg-sky-900/80 text-sky-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {isHuman
                  ? <User className="w-2.5 h-2.5" />
                  : <Bot className="w-2.5 h-2.5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`font-mono truncate ${isHuman ? 'text-sky-200' : 'text-slate-300'}`}>
                  {isHuman ? player.id.slice(0, 12) : `Bot-${player.id}`}
                </div>
                <div className="text-[9px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span>{player.path.length} pts</span>
                  {eventsNow > 0 && <span className="text-amber-500">{eventsNow} ev</span>}
                  {isActive && (
                    <span className="flex items-center gap-0.5 text-emerald-500">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      live
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-[#151f35] bg-[#09101c]">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Legend</div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-sky-400 rounded-full" />
            <span className="text-slate-400">Human path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-slate-500 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(to right, #64748b 0, #64748b 3px, transparent 3px, transparent 6px)' }} />
            <span className="text-slate-400">Bot path</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-3 border-2 border-red-400 rounded-full relative"><span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">✦</span></span>Kill</div>
          <div className="flex items-center gap-1.5 text-rose-400"><span className="text-[11px]">☠</span>Death</div>
          <div className="flex items-center gap-1.5 text-amber-400"><span className="text-[11px]">◆</span>Loot</div>
          <div className="flex items-center gap-1.5 text-purple-400"><span className="text-[11px]">⚡</span>Storm</div>
        </div>
      </div>
    </div>
  );
};
