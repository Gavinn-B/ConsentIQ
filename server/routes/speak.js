import { Router } from 'express';
import { textToSpeech } from '../utils/elevenlabs.js';

const router = Router();

// POST /api/speak — accepts { text }, streams back MP3 audio
router.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const audioStream = await textToSpeech(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    for await (const chunk of audioStream) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TTS failed', details: err.message });
  }
});

export default router;
