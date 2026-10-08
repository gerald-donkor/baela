"""Build the 28-second narration and ducked music mix from saved audio takes."""
from pathlib import Path
import array
import json
import subprocess
import wave

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'audio'
OUTPUT.mkdir(exist_ok=True)
RATE = 48000
DURATION = 28
script = json.loads((ROOT / 'voiceover/script.json').read_text())
narration = array.array('h', [0]) * (RATE * DURATION * 2)
report = []
for block in script:
    raw = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(ROOT / 'voiceover' / (block['id'] + '.mp3')),
        '-f', 's16le', '-ac', '2', '-ar', str(RATE), 'pipe:1',
    ])
    take = array.array('h')
    take.frombytes(raw)
    start = round(block['start'] * RATE) * 2
    end = start + len(take)
    if end > len(narration):
        raise ValueError(f"Narration exceeds video: {block['id']}")
    if any(narration[start:end]):
        raise ValueError(f"Overlapping narration: {block['id']}")
    narration[start:end] = take
    report.append({'id': block['id'], 'start': block['start'], 'duration': len(take) / (RATE * 2), 'text': block['text']})
with wave.open(str(OUTPUT / 'narration.wav'), 'wb') as stream:
    stream.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
    stream.writeframes(narration.tobytes())
# The original 24-second synthesized bed is gently retimed to 28 seconds.
# A split narration signal ducks the backing music only during speech.
filters = (
    '[0:a]highpass=f=75,lowpass=f=14500,acompressor=threshold=0.14:ratio=2:attack=10:release=110:makeup=1.4,'
    'asplit=2[voice][control];'
    '[1:a]atempo=0.857142857,volume=0.28,afade=t=in:d=0.8,afade=t=out:st=26.4:d=1.6[music];'
    '[music][control]sidechaincompress=threshold=0.025:ratio=5:attack=12:release=220:makeup=1[ducked];'
    '[voice][ducked]amix=inputs=2:duration=first:normalize=0,'
    'loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000[final]'
)
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
    '-i', str(OUTPUT / 'narration.wav'), '-i', str(ROOT / 'soundtrack.wav'),
    '-filter_complex', filters, '-map', '[final]', '-c:a', 'pcm_s16le',
    '-t', str(DURATION), str(OUTPUT / 'final-mix.wav'),
], check=True)
(OUTPUT / 'narration-timing.json').write_text(json.dumps(report, indent=2) + '\n')
print('Narration and music mixed: ' + str(OUTPUT / 'final-mix.wav'))
