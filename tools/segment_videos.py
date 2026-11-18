"""Split the released H.264 tracks into static, independently downloadable files."""
import argparse
import base64
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

def opening(source, ffmpeg, frame_count, original_init, shift, dest):
    """Encode the first GOP for a quick start, then return to the released track at its IDR."""
    rate = "1350k" if source.parent.name=="main" else "600k"
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "opening.mp4"
        subprocess.run([ffmpeg, "-nostdin", "-v", "error", "-i", str(source),
                        "-map", "0:v:0", "-frames:v", str(frame_count),
                        "-c:v", "libx264", "-threads", "4", "-preset", "slow",
                        "-crf", "22", "-maxrate", rate, "-bufsize", rate,
                        "-x264-params", "bframes=0:vbv-init=0.09:keyint=60",
                        "-video_track_timescale", str(SCALE), "-movflags",
                        "+empty_moov+default_base_moof+frag_keyframe+skip_trailer",
                        "-frag_duration", "100000", str(out)], check=True)
        out_data = bytearray(out.read_bytes())
    cuts = [0]
    for kind, pos, moof in boxes(out_data):
        if kind!=b"moof": continue
        # The original B-frame stream starts presenting after its decode timestamp.
        t, _ = fragment_info(moof)
        if (len(cuts)==1 and t>=1.2) or (len(cuts)==2 and t>=4): cuts.append(pos)
        marker = moof.index(b"tfdt")+4
        assert moof[marker]==1
        offset = pos+8+marker+4
        struct.pack_into(">Q", out_data, offset, struct.unpack_from(">Q",out_data,offset)[0]+shift)
    out_data.extend(original_init)
    name = "opening-"+hashlib.sha256(out_data).hexdigest()[:12]
    files = []
    for i,start in enumerate(cuts):
        label = f"{name}-{i}"
        (dest/(label+".m4s")).write_bytes(out_data[start:cuts[i+1] if i+1<len(cuts) else None])
        files.append(label)
    return files

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
    result = [name, [round(t,3) for _, t, _ in starts], [i for i, (_,_,key) in enumerate(starts) if key]]

    if source.parent.name in ("main", "multi"):
        first_trun = data.index(b"trun")+4
        flags = int.from_bytes(data[first_trun+1:first_trun+4], "big")
        assert flags & 0x800
        cts = first_trun + 8 + 4*sum(bool(flags & mask) for mask in (1,4,0x100,0x200,0x400))
        shift = struct.unpack_from(">I",data,cts)[0]
        key = result[2][1]
        frames = round(starts[key][1]*30)
        result.append(opening(source, ffmpeg, frames, data[:init_size], shift, dest))
        result.append(base64.b64encode(data[:init_size]).decode())
    else:
        result.extend([None, None])
    first, second = result[3][:2] if result[3] else ("0", "1")
    head = (dest/(first+".m4s")).read_bytes()
    joined = head + (dest/(second+".m4s")).read_bytes()
    mirror = "start-"+hashlib.sha256(joined).hexdigest()[:12]
    (dest/(mirror+".m4s")).write_bytes(joined)
    result.append([mirror, len(head)])
    return result

if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--ffmpeg", default="ffmpeg")
    args = cli.parse_args()
    files = sorted(f for d in ("multi", "main", "sim/references") for f in (ROOT/"media"/d).glob("*.mp4"))
    result = {str(f.relative_to(ROOT)): build(f, args.ffmpeg) for f in files}
    (ROOT/"assets"/"segments"/"manifest.json").write_text(json.dumps(result,separators=(",",":"))+"\n")
