import pyarrow.parquet as pq
import glob
import pandas as pd

f = glob.glob(r"G:\lilagame\player_data\player_data\February_10\\*")[0]
table = pq.read_table(f)
print("Schema ts field:", table.schema.field('ts'))
df = table.to_pandas()
print("Raw ts values:")
print(df[['user_id', 'event', 'ts']].head(20))
print("Timestamp integer values:")
print([x.value for x in df['ts'].head(10)])
print("ts diffs between consecutive rows:")
print(df['ts'].diff().head(10))

# Let's inspect across more files to see duration distribution
durations = []
all_files = glob.glob(r"G:\lilagame\player_data\player_data\February_10\\*")[:50]
for f in all_files:
    if f.endswith('.DS_Store'): continue
    t = pq.read_table(f, columns=['ts'])
    d = t.to_pandas()
    if len(d) > 1:
        diff_ms = (d['ts'].max() - d['ts'].min()).total_seconds() * 1000
        durations.append(diff_ms)

print("\nDurations for 50 files (ms):", durations[:10])
print(f"Min: {min(durations)} ms, Max: {max(durations)} ms, Mean: {sum(durations)/len(durations)} ms")
