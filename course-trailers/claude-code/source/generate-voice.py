"""Optional regeneration of the saved English neural voice takes (requires edge-tts)."""
import asyncio
import json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent / 'voiceover'
async def main():
    for segment in json.loads((ROOT / 'script.json').read_text()):
        voice = edge_tts.Communicate(segment['text'], 'en-US-AndrewMultilingualNeural', rate='-15%', pitch='+0Hz')
        await voice.save(str(ROOT / (segment['id'] + '.mp3')), str(ROOT / (segment['id'] + '.vtt')))
        print('Saved', segment['id'], flush=True)

if __name__ == '__main__':
    asyncio.run(main())
