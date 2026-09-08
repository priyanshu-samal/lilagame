import pyarrow as pa
import pyarrow.parquet as pq
import glob

f = glob.glob(r"G:\lilagame\player_data\player_data\February_10\\*")[0]
table = pq.read_table(f)
col = table.column('ts')
print("First 10 values as int64:", col.cast(pa.int64())[:10])
print("First 10 values as int64 list:", col.cast(pa.int64())[:10].to_pylist())
