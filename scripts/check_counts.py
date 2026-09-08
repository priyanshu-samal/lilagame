import os
from collections import defaultdict

base_dir = r"G:\lilagame\player_data\player_data"
dates = ["February_10", "February_11", "February_12", "February_13", "February_14"]
match_files_count = defaultdict(int)
for d in dates:
    folder = os.path.join(base_dir, d)
    if not os.path.exists(folder): continue
    for f in os.listdir(folder):
        if f.startswith('.'): continue
        parts = f.split('_')
        m_id = '_'.join(parts[1:])
        match_files_count[m_id] += 1

counts = defaultdict(int)
for m_id, cnt in match_files_count.items():
    counts[cnt] += 1

print("Matches by player/bot file count:")
for cnt, num in sorted(counts.items()):
    print(f"  {cnt} files: {num} matches")
