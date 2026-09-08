import os
import glob
from PIL import Image
import pyarrow.parquet as pq
import pandas as pd

base_dir = r"G:\lilagame\player_data\player_data"

print("--- 1. Minimap dimensions ---")
minimap_dir = os.path.join(base_dir, "minimaps")
for img_name in sorted(os.listdir(minimap_dir)):
    img_path = os.path.join(minimap_dir, img_name)
    with Image.open(img_path) as im:
        print(f"{img_name}: {im.size} (format: {im.format}, mode: {im.mode})")

print("\n--- 2. File counts by date ---")
dates = ["February_10", "February_11", "February_12", "February_13", "February_14"]
total_files = 0
all_files = []
for d in dates:
    folder = os.path.join(base_dir, d)
    if os.path.exists(folder):
        files = [f for f in os.listdir(folder) if not f.startswith('.')]
        print(f"{d}: {len(files)} files")
        total_files += len(files)
        for f in files:
            all_files.append((d, os.path.join(folder, f), f))
print(f"Total files: {total_files}")

print("\n--- 3. Parquet Schema & First Row ---")
first_file = all_files[0][1]
schema = pq.read_schema(first_file)
print("Schema:")
for name in schema.names:
    print(f"  {name}: {schema.field(name).type}")

print("\n--- 4. Scanning all files for metadata, maps, events, players, matches ---")
unique_maps = set()
unique_events = set()
unique_players = set()
unique_matches = set()
human_players = set()
bot_players = set()
matches_by_map = {}
matches_by_date = {d: set() for d in dates}
events_by_type = {}
total_rows = 0

# Sample read all files
sample_human_coords = []
sample_bot_coords = []
out_of_bounds_coords = 0

for d, fpath, fname in all_files:
    # Determine bot vs human by user_id from filename or inside table
    parts = fname.split('_')
    file_user_id = parts[0]
    
    try:
        t = pq.read_table(fpath)
        df = t.to_pandas()
        total_rows += len(df)
        
        for map_val in df['map_id'].unique():
            unique_maps.add(str(map_val))
            
        for match_val in df['match_id'].unique():
            unique_matches.add(str(match_val))
            matches_by_date[d].add(str(match_val))
            m_id = str(match_val)
            map_name = str(df['map_id'].iloc[0])
            matches_by_map[m_id] = map_name
            
        for u_val in df['user_id'].unique():
            u_str = str(u_val)
            unique_players.add(u_str)
            if '-' in u_str and len(u_str) > 20:
                human_players.add(u_str)
            else:
                bot_players.add(u_str)
                
        for ev in df['event']:
            if isinstance(ev, bytes):
                ev_str = ev.decode('utf-8', errors='replace')
            else:
                ev_str = str(ev)
            unique_events.add(ev_str)
            events_by_type[ev_str] = events_by_type.get(ev_str, 0) + 1
            
    except Exception as e:
        print(f"Error reading {fpath}: {e}")

print(f"\nTotal rows: {total_rows}")
print(f"Unique maps: {sorted(list(unique_maps))}")
print(f"Unique matches: {len(unique_matches)}")
print(f"Unique players: {len(unique_players)} (Humans: {len(human_players)}, Bots: {len(bot_players)})")

print("\nMatches by date:")
for d, m_set in matches_by_date.items():
    print(f"  {d}: {len(m_set)} matches")

print("\nMatches by map:")
map_counts = {}
for m_id, m_map in matches_by_map.items():
    map_counts[m_map] = map_counts.get(m_map, 0) + 1
for m_map, count in map_counts.items():
    print(f"  {m_map}: {count} matches")

print("\nEvents by type:")
for ev, count in sorted(events_by_type.items(), key=lambda x: x[1], reverse=True):
    print(f"  {ev}: {count}")
