import { MapId, MapConfig } from './coordinates';

export type EventType =
  | 'Position'
  | 'BotPosition'
  | 'Kill'
  | 'Killed'
  | 'BotKill'
  | 'BotKilled'
  | 'KilledByStorm'
  | 'Loot';

export type PlayerFilter = 'all' | 'humans' | 'bots';

export type VisualizationMode =
  | 'replay'
  | 'traffic'
  | 'kills'
  | 'deaths'
  | 'storm';

export interface DateOption {
  id: string;
  label: string;
  is_partial: boolean;
}

export interface MatchSummary {
  id: string;
  map: MapId;
  date: string;
  duration: number; // elapsed seconds
  human_count: number;
  bot_count: number;
  total_players: number;
  kills: number;
  deaths: number;
  storm_deaths: number;
  loot_count: number;
  total_events: number;
}

export interface ManifestData {
  maps: Record<MapId, MapConfig>;
  dates: DateOption[];
  matches: MatchSummary[];
  total_matches: number;
  generated_at: string;
}

/**
 * Single path point: [rel_ts, x, z, u, v]
 */
export type TrajectoryPoint = [number, number, number, number, number];

/**
 * Single discrete event: [rel_ts, event_name, x, z, u, v]
 */
export type PlayerEvent = [number, EventType, number, number, number, number];

export interface PlayerJourney {
  id: string;
  is_bot: boolean;
  path: TrajectoryPoint[];
  events: PlayerEvent[];
}

export interface TimelineEvent {
  t: number; // elapsed seconds from match start
  type: EventType;
  user_id: string;
  is_bot: boolean;
  x: number;
  z: number;
  u: number;
  v: number;
}

export interface MatchDetail {
  match_id: string;
  map_id: MapId;
  date: string;
  duration: number; // total elapsed seconds
  min_ts: number;
  max_ts: number;
  stats: {
    duration: number;
    human_count: number;
    bot_count: number;
    total_players: number;
    kill_count: number;
    death_count: number;
    pvp_kill_count: number;
    bot_kill_count: number;
    pvp_death_count: number;
    bot_killed_count: number;
    storm_death_count: number;
    loot_count: number;
    total_events: number;
  };
  players: PlayerJourney[];
  timeline: TimelineEvent[];
}

export interface MapHeatmapData {
  traffic_human: [number, number][]; // [u, v]
  traffic_bot: [number, number][];   // [u, v]
  kills: [number, number, number][];  // [u, v, is_bot_kill]
  deaths: [number, number, number][]; // [u, v, is_storm]
  storm_deaths: [number, number][];  // [u, v]
}
