import pyarrow.parquet as pq
import glob
import pandas as pd
import numpy as np

f = glob.glob(r"G:\lilagame\player_data\player_data\February_10\\*")[0]
df = pq.read_table(f).to_pandas()
df['raw_ts'] = [x.value // 10**6 for x in df['ts']]
df['dx'] = df['x'].diff()
df['dz'] = df['z'].diff()
df['dist'] = np.sqrt(df['dx']**2 + df['dz']**2)
df['dt'] = df['raw_ts'].diff()

print(df[['x', 'z', 'raw_ts', 'dt', 'dist', 'event']].head(20))

print("\nSummary of dist and dt:")
print("dt value counts (raw_ts difference):")
print(df['dt'].value_counts().head(10))
print("dist stats:")
print(df['dist'].describe())
