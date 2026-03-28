import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Converts plain text to an MP3 audio stream using ElevenLabs TTS
export async function textToSpeech(text) {
  const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text,
    model_id: 'eleven_turbo_v2',
    output_format: 'mp3_44100_128',
  });

  return audio; // readable stream
}
