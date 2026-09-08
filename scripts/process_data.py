import os
import json
import pyarrow as pa
import pyarrow.parquet as pq
from collections import defaultdict

base_dir = r"G:\lilagame\player_data\player_data"
out_dir = r"G:\lilagame\public\data"
matches_out_dir = os.path.join(out_dir, "matches")
heatmaps_out_dir = os.path.join(out_dir, "heatmaps")

os.makedirs(matches_out_dir, exist_ok=True)
os.makedirs(heatmaps_out_dir, exist_ok=True)

MAP_CONFIGS = {
    'AmbroseValley': {'scale': 900.0, 'origin_x': -370.0, 'origin_z': -473.0, 'image': '/minimaps/AmbroseValley.webp', 'width': 2048, 'height': 2048},
    'GrandRift': {'scale': 581.0, 'origin_x': -290.0, 'origin_z': -290.0, 'image': '/minimaps/GrandRift.webp', 'width': 2048, 'height': 2048},
    'Lockdown': {'scale': 1000.0, 'origin_x': -500.0, 'origin_z': -500.0, 'image': '/minimaps/Lockdown.webp', 'width': 2048, 'height': 2048},
}

DATES_INFO = [
    {"id": "February_10", "label": "Feb 10, 2026", "is_partial": False},
    {"id": "February_11", "label": "Feb 11, 2026", "is_partial": False},
    {"id": "February_12", "label": "Feb 12, 2026", "is_partial": False},
    {"id": "February_13", "label": "Feb 13, 2026", "is_partial": False},
    {"id": "February_14", "label": "Feb 14, 2026 (Partial Data)", "is_partial": True},
]

dates = [d['id'] for d in DATES_INFO]

# 1. Group files by match
print("Scanning files by match...")
match_groups = defaultdict(lambda: {'files': [], 'date': None})

for d in dates:
    folder = os.path.join(base_dir, d)
    if not os.path.exists(folder): continue
    for f in os.listdir(folder):
        if f.startswith('.') or 'README' in f: continue
        parts = f.split('_')
        u_id = parts[0]
        m_id = '_'.join(parts[1:])
        match_groups[m_id]['files'].append((u_id, os.path.join(folder, f)))
        match_groups[m_id]['date'] = d

print(f"Total unique matches: {len(match_groups)}")

# Map-level heatmap accumulator
heatmaps = {
    m: {
        'traffic_human': [],
        'traffic_bot': [],
        'kills': [],
        'deaths': [],
        'storm_deaths': []
    } for m in MAP_CONFIGS
}

match_summaries = []

# Process each match
for m_idx, (m_id, m_info) in enumerate(match_groups.items()):
    date_id = m_info['date']
    files = m_info['files']
    
    all_rows = []
    map_id = None
    
    for u_id, fpath in files:
        is_bot = '-' not in u_id or len(u_id) <= 10
        try:
            table = pq.read_table(fpath)
            df = table.to_pandas()
            if len(df) == 0: continue
            
            # Read int64 timestamp values
            raw_ts = table.column('ts').cast(pa.int64()).to_pylist()
            df['raw_ts'] = raw_ts
            
            if map_id is None and len(df) > 0:
                map_id = str(df['map_id'].iloc[0])
                
            for idx, row in df.iterrows():
                ev = row['event']
                if isinstance(ev, bytes):
                    ev_str = ev.decode('utf-8', errors='replace')
                else:
                    ev_str = str(ev)
                    
                x = float(row['x'])
                y = float(row['y'])
                z = float(row['z'])
                ts = int(row['raw_ts'])
                
                all_rows.append({
                    'user_id': str(row['user_id']),
                    'is_bot': is_bot,
                    'x': x,
                    'y': y,
                    'z': z,
                    'ts': ts,
                    'event': ev_str
                })
        except Exception as e:
            print(f"Error reading {fpath}: {e}")
            
    if not all_rows or map_id not in MAP_CONFIGS:
        continue
        
    cfg = MAP_CONFIGS[map_id]
    scale = cfg['scale']
    ox = cfg['origin_x']
    oz = cfg['origin_z']
    
    # Sort all rows by ts
    all_rows.sort(key=lambda r: r['ts'])
    min_ts = all_rows[0]['ts']
    max_ts = all_rows[-1]['ts']
    duration = max_ts - min_ts
    
    # Group by player
    player_data = defaultdict(lambda: {
        'id': None,
        'is_bot': False,
        'path': [],
        'events': []
    })
    
    timeline = []
    
    # Summary stats
    human_users = set()
    bot_users = set()
    kill_count = 0
    death_count = 0
    bot_kill_count = 0
    bot_killed_count = 0
    pvp_kill_count = 0
    pvp_death_count = 0
    storm_death_count = 0
    loot_count = 0
    
    for r in all_rows:
        rel_ts = r['ts'] - min_ts
        u = round((r['x'] - ox) / scale, 4)
        v = round((r['z'] - oz) / scale, 4)
        x_rnd = round(r['x'], 2)
        z_rnd = round(r['z'], 2)
        
        uid = r['user_id']
        is_bot = r['is_bot']
        ev = r['event']
        
        if is_bot:
            bot_users.add(uid)
        else:
            human_users.add(uid)
            
        p = player_data[uid]
        p['id'] = uid
        p['is_bot'] = is_bot
        
        # Add to heatmap
        if ev in ('Position', 'BotPosition'):
            if is_bot:
                heatmaps[map_id]['traffic_bot'].append([u, v])
            else:
                heatmaps[map_id]['traffic_human'].append([u, v])
            # Path entry: [rel_ts, x, z, u, v]
            p['path'].append([rel_ts, x_rnd, z_rnd, u, v])
        else:
            # Discrete event
            p['events'].append([rel_ts, ev, x_rnd, z_rnd, u, v])
            timeline.append({
                't': rel_ts,
                'type': ev,
                'user_id': uid,
                'is_bot': is_bot,
                'x': x_rnd,
                'z': z_rnd,
                'u': u,
                'v': v
            })
            
            # Heatmaps & stats
            if ev == 'Kill':
                pvp_kill_count += 1
                kill_count += 1
                heatmaps[map_id]['kills'].append([u, v, 0]) # 0 = pvp
            elif ev == 'BotKill':
                bot_kill_count += 1
                kill_count += 1
                heatmaps[map_id]['kills'].append([u, v, 1]) # 1 = bot kill
            elif ev == 'Killed':
                pvp_death_count += 1
                death_count += 1
                heatmaps[map_id]['deaths'].append([u, v, 0])
            elif ev == 'BotKilled':
                bot_killed_count += 1
                death_count += 1
                heatmaps[map_id]['deaths'].append([u, v, 1])
            elif ev == 'KilledByStorm':
                storm_death_count += 1
                death_count += 1
                heatmaps[map_id]['deaths'].append([u, v, 2]) # 2 = storm
                heatmaps[map_id]['storm_deaths'].append([u, v])
            elif ev == 'Loot':
                loot_count += 1

    # Save match JSON
    match_payload = {
        'match_id': m_id,
        'map_id': map_id,
        'date': date_id,
        'duration': duration,
        'min_ts': min_ts,
        'max_ts': max_ts,
        'stats': {
            'duration': duration,
            'human_count': len(human_users),
            'bot_count': len(bot_users),
            'total_players': len(human_users) + len(bot_users),
            'kill_count': kill_count,
            'death_count': death_count,
            'pvp_kill_count': pvp_kill_count,
            'bot_kill_count': bot_kill_count,
            'pvp_death_count': pvp_death_count,
            'bot_killed_count': bot_killed_count,
            'storm_death_count': storm_death_count,
            'loot_count': loot_count,
            'total_events': len(all_rows)
        },
        'players': list(player_data.values()),
        'timeline': timeline
    }
    
    match_file_path = os.path.join(matches_out_dir, f"{m_id}.json")
    with open(match_file_path, 'w', encoding='utf-8') as mf:
        json.dump(match_payload, mf, separators=(',', ':'))
        
    match_summaries.append({
        'id': m_id,
        'map': map_id,
        'date': date_id,
        'duration': duration,
        'human_count': len(human_users),
        'bot_count': len(bot_users),
        'total_players': len(human_users) + len(bot_users),
        'kills': kill_count,
        'deaths': death_count,
        'storm_deaths': storm_death_count,
        'loot_count': loot_count,
        'total_events': len(all_rows)
    })

# Save manifest.json
manifest = {
    'maps': MAP_CONFIGS,
    'dates': DATES_INFO,
    'matches': match_summaries,
    'total_matches': len(match_summaries),
    'generated_at': '2026-02-14'
}

manifest_path = os.path.join(out_dir, "manifest.json")
with open(manifest_path, 'w', encoding='utf-8') as mf:
    json.dump(manifest, mf, separators=(',', ':'))
print(f"Manifest written to {manifest_path} ({len(match_summaries)} matches)")

# Save heatmaps
for m_name, h_data in heatmaps.items():
    h_path = os.path.join(heatmaps_out_dir, f"{m_name}.json")
    with open(h_path, 'w', encoding='utf-8') as hf:
        json.dump(h_data, hf, separators=(',', ':'))
    print(f"Heatmap for {m_name}: {len(h_data['traffic_human'])} human pts, {len(h_data['traffic_bot'])} bot pts, {len(h_data['kills'])} kills, {len(h_data['deaths'])} deaths, {len(h_data['storm_deaths'])} storm deaths")

print("Processing complete!")
