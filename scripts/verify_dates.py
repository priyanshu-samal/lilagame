import pyarrow.parquet as pq
import glob
from datetime import datetime

dates = ["February_10", "February_11", "February_12", "February_13", "February_14"]
for d in dates:
    f = glob.glob(fr"G:\lilagame\player_data\player_data\{d}\*")[0]
    t = pq.read_table(f)
    col = t.column('ts')
    first_int = col.to_pylist()[0]
    # in python pyarrow to_pylist() on timestamp[ms] might return datetime
    if hasattr(first_int, 'timestamp'):
        # raw int was ms since 1970
        ms_val = int(first_int.timestamp() * 1000)
    else:
        ms_val = int(first_int)
    dt_from_sec = datetime.utcfromtimestamp(ms_val)
    print(f"{d}: raw integer={ms_val} -> as epoch seconds: {dt_from_sec}")
