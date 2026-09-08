# Coordinate test

configs = {
    'AmbroseValley': {'scale': 900.0, 'origin_x': -370.0, 'origin_z': -473.0},
    'GrandRift': {'scale': 581.0, 'origin_x': -290.0, 'origin_z': -290.0},
    'Lockdown': {'scale': 1000.0, 'origin_x': -500.0, 'origin_z': -500.0},
}

# README sample:
# Ambrose Valley:
# x = -301.45, z = -355.55
# u = 0.0762, v = 0.1305
# pixel_x approx 78, pixel_y approx 890 (for 1024x1024)

x = -301.45
z = -355.55
cfg = configs['AmbroseValley']
u = (x - cfg['origin_x']) / cfg['scale']
v = (z - cfg['origin_z']) / cfg['scale']
print(f"Ambrose Valley test sample:")
print(f"u: {u:.4f} (expected ~0.0762)")
print(f"v: {v:.4f} (expected ~0.1305)")

px_1024 = u * 1024
py_1024 = (1 - v) * 1024
print(f"1024x1024 pixels: x={px_1024:.2f} (approx 78), y={py_1024:.2f} (approx 890)")

# Check coordinate bounds across all telemetry points in dataset
import pyarrow.parquet as pq
import glob
import os

all_files = glob.glob(r"G:\lilagame\player_data\player_data\February_*\\*")
oob_count = 0
total_pts = 0
min_u, max_u = 999, -999
min_v, max_v = 999, -999

for f in all_files:
    if f.endswith('.DS_Store') or 'README' in f: continue
    t = pq.read_table(f, columns=['map_id', 'x', 'z', 'ts'])
    df = t.to_pandas()
    map_id = df['map_id'].iloc[0]
    c = configs[map_id]
    u_vals = (df['x'] - c['origin_x']) / c['scale']
    v_vals = (df['z'] - c['origin_z']) / c['scale']
    
    total_pts += len(df)
    oob = ((u_vals < 0) | (u_vals > 1) | (v_vals < 0) | (v_vals > 1)).sum()
    oob_count += oob
    min_u = min(min_u, u_vals.min())
    max_u = max(max_u, u_vals.max())
    min_v = min(min_v, v_vals.min())
    max_v = max(max_v, v_vals.max())

print(f"\nAll telemetry points coordinate check:")
print(f"Total points: {total_pts}")
print(f"Points outside [0, 1] UV bounds: {oob_count} ({oob_count/total_pts*100:.2f}%)")
print(f"U range: [{min_u:.4f}, {max_u:.4f}]")
print(f"V range: [{min_v:.4f}, {max_v:.4f}]")
