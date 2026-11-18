"""Split the released H.264 tracks into static, independently downloadable files."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCALE = 15360

def boxes(data):
    offset = 0
    while offset < len(data):
        size, kind = struct.unpack_from(">I4s", data, offset)
        if size < 8 or offset + size > len(data):
            raise ValueError("Invalid MP4 box")
        yield kind, offset, data[offset + 8:offset + size]
        offset += size

def fragment_info(moof):
    traf = dict((kind, box) for kind, _, box in boxes(moof))[b"traf"]
    fields = {kind: box for kind, _, box in boxes(traf)}
    tfdt = fields[b"tfdt"]
    time = int.from_bytes(tfdt[4:], "big") / SCALE
    # FFmpeg marks the first sync sample in a keyframe fragment explicitly.
    trun = fields[b"trun"]
    flags = int.from_bytes(trun[1:4], "big")
    offset = 8 + (4 if flags & 1 else 0)
    sync = bool(flags & 4) and not (struct.unpack_from(">I", trun, offset)[0] & 0x10000)
    return time, sync

def build(source, ffmpeg):
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "track.mp4"
        subprocess.run([ffmpeg, "-nostdin", "-loglevel", "error", "-i", str(source),
                        "-map", "0:v:0", "-c", "copy", "-video_track_timescale", str(SCALE),
                        "-movflags", "+empty_moov+default_base_moof+frag_keyframe",
                        "-frag_duration", "133333", str(out)], check=True)
        data = out.read_bytes()
    records = [(pos, *fragment_info(body)) for kind,pos,body in boxes(data) if kind==b"moof"]
    assert records[0][2]
    starts = [(0, 0.0, True)]
    for pos, time, sync in records[1:]:
        target = 0.26 if len(starts)==1 else 0.9 if len(starts)==2 else 2.5
        if sync or time-starts[-1][1] >= target:
            starts.append((pos, time, sync))
    # Hash the cuts as well as the bytes so packaging changes get a fresh URL.
    name = hashlib.sha256(data + str(starts).encode()).hexdigest()[:12]
    dest = ROOT / "assets" / "segments" / name
    dest.mkdir(parents=True, exist_ok=True)
    init_size = records[0][0]
    for i, (pos, _, _) in enumerate(starts):
        end = starts[i+1][0] if i+1<len(starts) else len(data)
        (dest / f"{i}.m4s").write_bytes(data[pos:end])
    (dest / "init.m4s").write_bytes(data[:init_size])
    return [name, [round(t,3) for _, t, _ in starts], [i for i, (_,_,key) in enumerate(starts) if key]]

if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--ffmpeg", default="ffmpeg")
    args = cli.parse_args()
    files = sorted(f for d in ("multi", "main", "sim/references") for f in (ROOT/"media"/d).glob("*.mp4"))
    result = {str(f.relative_to(ROOT)): build(f, args.ffmpeg) for f in files}
    (ROOT/"assets"/"segments"/"manifest.json").write_text(json.dumps(result,separators=(",",":"))+"\n")
