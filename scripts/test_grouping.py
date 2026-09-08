import os
import glob
import json
import pyarrow as pa
import pyarrow.parquet as pq
from collections import defaultdict

base_dir = r"G:\lilagame\player_data\player_data"
dates = ["February_10", "February_11", "February_12", "February_13", "February_14"]

configs = {
    'AmbroseValley': {'scale': 900.0, 'origin_x': -370.0, 'origin_z': -473.0},
    'GrandRift': {'scale': 581.0, 'origin_x': -290.0, 'origin_z': -290.0},
    'Lockdown': {'scale': 1000.0, 'origin_x': -500.0, 'origin_z': -500.0},
}

matches_map = defaultdict(lambda: {
    'files': [],
    'date': None,
    'map_id': None
})

for d in dates:
    folder = os.path.join(base_dir, d)
    if not os.path.exists(folder): continue
    for f in os.listdir(folder):
        if f.startswith('.'): continue
        parts = f.split('_')
        u_id = parts[0]
        m_id = '_'.join(parts[1:])
        matches_map[m_id]['files'].append((u_id, os.path.join(folder, f)))
        matches_map[m_id]['date'] = d

print(f"Total unique matches: {len(matches_map)}")

# Check event types mapping
event_names = [
    'Position', 'BotPosition', 'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot'
]
event_to_id = {name: i for i, name in enumerate(event_names)}

sample_match_id = list(matches_map.keys())[0]
sample_match = matches_map[sample_match_id]
print(f"Sample match {sample_match_id} has {len(sample_match['files'])} files")
