import pyarrow.parquet as pq
import glob
import pandas as pd
from collections import defaultdict

match_files = defaultdict(list)
all_files = glob.glob(r"G:\lilagame\player_data\player_data\February_*\\*")
for f in all_files:
    if f.endswith('.DS_Store') or 'README' in f: continue
    # extract match_id
    parts = f.split('\\')[-1].split('_')
    match_id = '_'.join(parts[1:])
    match_files[match_id].append(f)

# Sort matches by number of files
sorted_matches = sorted(match_files.items(), key=lambda x: len(x[1]), reverse=True)
print("Top 5 matches by file count:")
for m_id, f_list in sorted_matches[:5]:
    print(f"Match {m_id}: {len(f_list)} files")
    dfs = []
    for f in f_list:
        dfs.append(pq.read_table(f).to_pandas())
    m_df = pd.concat(dfs, ignore_index=True)
    m_df['ts_ms'] = m_df['ts'].apply(lambda x: x.value // 10**6 if hasattr(x, 'value') else int(x))
    min_t = m_df['ts_ms'].min()
    max_t = m_df['ts_ms'].max()
    dur_sec = (max_t - min_t) / 1000
    events = m_df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else str(x)).value_counts().to_dict()
    humans = m_df['user_id'].apply(lambda x: '-' in str(x)).sum()
    bots = len(m_df) - humans
    unique_humans = len([u for u in m_df['user_id'].unique() if '-' in str(u)])
    unique_bots = len([u for u in m_df['user_id'].unique() if '-' not in str(u)])
    print(f"  Map: {m_df['map_id'].iloc[0]}, Duration: {dur_sec:.1f}s ({dur_sec/60:.2f} min)")
    print(f"  Players: {unique_humans} humans, {unique_bots} bots | Total rows: {len(m_df)}")
    print(f"  Events: {events}")
    print()
