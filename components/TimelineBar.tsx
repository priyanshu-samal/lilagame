'use client';

import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatElapsedSeconds } from '@/lib/utils';
import { TimelineEvent } from '@/lib/types';

interface TimelineBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  timelineEvents: TimelineEvent[];
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onRewind: () => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  currentTime,
  duration,
  isPlaying,
  playbackSpeed,
  timelineEvents,
  onPlayToggle,
  onSeek,
  onSpeedChange,
  onRewind,
}) => {
  const speeds = [0.5, 1, 2, 4];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  return (
    <div className="w-full bg-[#0a0f1d] border-t border-[#1e293b] px-4 py-2.5 flex flex-col gap-1.5 select-none z-20">
      {/* Top row: Controls, Time readout, Speed pills */}
      <div className="flex items-center justify-between text-xs">
        {/* Left: Play/Pause/Rewind and Elapsed/Total Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRewind}
            className="p-1.5 rounded-full bg-[#1e293b] hover:bg-[#334155] text-slate-300 transition-colors"
            title="Rewind to 00:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onPlayToggle}
            className={`p-2 rounded-full font-bold text-white transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/50'
                : 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/50'
            }`}
            title={isPlaying ? 'Pause Replay' : 'Play Replay'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Time display: MM:SS / MM:SS */}
          <div className="flex items-center gap-1.5 font-mono text-sm">
            <span className="text-sky-400 font-bold tracking-wide">
              {formatElapsedSeconds(currentTime)}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">
              {formatElapsedSeconds(duration)}
            </span>
            <span className="text-[10px] text-slate-500 ml-1 font-sans uppercase">
              (Elapsed Match Time)
            </span>
          </div>
        </div>

        {/* Center: Event tally in timeline */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Kills ({timelineEvents.filter(e => e.type === 'Kill' || e.type === 'BotKill').length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-700 inline-block"></span>
            Deaths ({timelineEvents.filter(e => e.type === 'Killed' || e.type === 'BotKilled').length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
            Storm ({timelineEvents.filter(e => e.type === 'KilledByStorm').length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            Loot ({timelineEvents.filter(e => e.type === 'Loot').length})
          </span>
        </div>

        {/* Right: Playback Speed selector */}
        <div className="flex items-center bg-[#131d31] border border-[#223354] rounded p-0.5 gap-0.5">
          <span className="text-[10px] text-slate-400 px-1.5 uppercase font-medium">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                playbackSpeed === s
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row: Interactive timeline track with event ticks */}
      <div className="relative w-full h-6 flex items-center group">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-2 bg-[#192338] rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-sky-600 via-indigo-500 to-sky-400 transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Event tick marks on timeline */}
        {duration > 0 &&
          timelineEvents.map((ev, i) => {
            const tickPercent = (ev.t / duration) * 100;
            let tickColor = '#facc15'; // loot gold
            if (ev.type === 'Kill' || ev.type === 'BotKill') tickColor = '#ef4444'; // red
            if (ev.type === 'Killed' || ev.type === 'BotKilled') tickColor = '#dc2626'; // dark red
            if (ev.type === 'KilledByStorm') tickColor = '#c084fc'; // purple

            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-sm pointer-events-none transition-transform z-10 hover:scale-150"
                style={{
                  left: `${tickPercent}%`,
                  backgroundColor: tickColor,
                }}
                title={`${ev.type} at ${formatElapsedSeconds(ev.t)}`}
              />
            );
          })}

        {/* Range input slider */}
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSliderChange}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-20"
        />

        {/* Scrubber thumb handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-sky-400 border-2 border-white rounded-full shadow-lg pointer-events-none transition-transform group-hover:scale-125 z-20"
          style={{ left: `calc(${progressPercent}% - 8px)` }}
        />
      </div>
    </div>
  );
};
