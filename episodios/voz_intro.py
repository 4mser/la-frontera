"""Voice «En el próximo capítulo de La frontera…» for the episode previews (same voice and pace as the film)."""
import asyncio, edge_tts
VOZ, RATE, PITCH = "en-US-BrianMultilingualNeural", "-10%", "-2Hz"
TXT = {"intro": "En el próximo capítulo de La frontera.", "intro2": "En el próximo capítulo de esta historia."}
async def main():
    for k, t in TXT.items():
        await edge_tts.Communicate(t, VOZ, rate=RATE, pitch=PITCH).save(f"voz/{k}.mp3")
asyncio.run(main())
