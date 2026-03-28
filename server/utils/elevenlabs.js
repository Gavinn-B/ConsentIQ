import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export async function textToSpeech(text) {
    // "JBFqnCBsd6RMkjVDRZzb" free voice ID
  const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text,
    model_id: 'eleven_turbo_v2', // fastest + cheapest, great for hackathon
    output_format: 'mp3_44100_128',
  });

  return audio; // returns a readable stream
}