import pyarrow as pa
import pyarrow.parquet as pq
import glob
import os

dates = ["February_10", "February_11", "February_12", "February_13", "February_14"]
for d in dates:
    files = [x for x in glob.glob(fr"G:\lilagame\player_data\player_data\{d}\*") if not x.endswith('.DS_Store')]
    f = files[0]
    t = pq.read_table(f)
    int_col = t.column('ts').cast(pa.int64()).to_pylist()
    fname = os.path.basename(f)
    print(f"{d} ({fname}): min={min(int_col)}, max={max(int_col)}, span={max(int_col) - min(int_col)}")
