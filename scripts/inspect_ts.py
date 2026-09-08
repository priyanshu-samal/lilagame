import pyarrow.parquet as pq
import glob
import pandas as pd

files = glob.glob(r"G:\lilagame\player_data\player_data\February_10\\*")[:10]
for f in files:
    if f.endswith('.DS_Store'): continue
    df = pq.read_table(f).to_pandas()
    print("File:", f.split('\\')[-1])
    print("Match:", df['match_id'].iloc[0])
    print("Player:", df['user_id'].iloc[0])
    print("ts dtype:", df['ts'].dtype)
    print("min ts:", df['ts'].min(), "max ts:", df['ts'].max())
    # converting ts to integer milliseconds
    if pd.api.types.is_datetime64_any_dtype(df['ts']):
        ms_min = df['ts'].min().value // 10**6
        ms_max = df['ts'].max().value // 10**6
        print(f"diff in ms: {ms_max - ms_min} ms ({ (ms_max - ms_min)/1000 :.2f} s)")
    break
