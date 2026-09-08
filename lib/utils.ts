import { EventType } from './types';

/**
 * Formats elapsed match seconds into MM:SS or MM:SS.s
 * e.g., 0 -> "00:00", 75 -> "01:15", 382 -> "06:22"
 */
export function formatElapsedSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Event type visual configurations and color palette.
 * Human: Blue
 * Bot: Neutral Gray / Slate
 * Kill: Bright Red (PvP)
 * BotKill: Crimson / Orange-Red
 * Killed: Dark Red Skull
 * BotKilled: Dark Red Bot Skull
 * Storm Death: Vibrant Purple Hazard
 * Loot: Gold / Yellow
 */
export interface EventVisual {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  shape: 'circle' | 'crosshair' | 'skull' | 'diamond' | 'storm';
}

export const EVENT_VISUALS: Record<EventType, EventVisual> = {
  Position: {
    label: 'Human Movement',
    color: '#38bdf8', // bright sky blue
    bgColor: 'rgba(56, 189, 248, 0.2)',
    icon: '●',
    shape: 'circle',
  },
  BotPosition: {
    label: 'Bot Movement',
    color: '#94a3b8', // slate gray
    bgColor: 'rgba(148, 163, 184, 0.2)',
    icon: '○',
    shape: 'circle',
  },
  Kill: {
    label: 'PvP Kill',
    color: '#ef4444', // red
    bgColor: 'rgba(239, 68, 68, 0.3)',
    icon: '✦',
    shape: 'crosshair',
  },
  Killed: {
    label: 'PvP Death',
    color: '#dc2626', // dark red
    bgColor: 'rgba(220, 38, 38, 0.4)',
    icon: '☠',
    shape: 'skull',
  },
  BotKill: {
    label: 'Bot Kill',
    color: '#f97316', // bright orange-red
    bgColor: 'rgba(249, 115, 22, 0.3)',
    icon: '⚔',
    shape: 'crosshair',
  },
  BotKilled: {
    label: 'Killed by Bot',
    color: '#b91c1c', // deep crimson
    bgColor: 'rgba(185, 28, 28, 0.4)',
    icon: '💀',
    shape: 'skull',
  },
  KilledByStorm: {
    label: 'Storm Death',
    color: '#c084fc', // electric purple
    bgColor: 'rgba(192, 132, 252, 0.4)',
    icon: '⚡',
    shape: 'storm',
  },
  Loot: {
    label: 'Item Looted',
    color: '#facc15', // vibrant gold
    bgColor: 'rgba(250, 204, 21, 0.3)',
    icon: '◆',
    shape: 'diamond',
  },
};

export const PLAYER_COLORS = {
  human: {
    stroke: '#38bdf8',
    fill: '#0284c7',
    glow: 'rgba(56, 189, 248, 0.6)',
    label: 'Human Player',
  },
  bot: {
    stroke: '#94a3b8',
    fill: '#64748b',
    glow: 'rgba(148, 163, 184, 0.4)',
    label: 'AI Bot',
  },
};
