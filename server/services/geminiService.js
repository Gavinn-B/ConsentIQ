// services/geminiService.js
// This file contains the function that calls the Gemini API.
// It is called by the route handler (routes/simplify.js).
// It reads the API key from process.env.GEMINI_API_KEY, which is loaded
// from the .env file by dotenv (configured in test-server.js).

import fetch from 'node-fetch';
import SYSTEM_PROMPT from '../prompts/systemPrompt.js'; 

export async function simplifyMedicalText(rawText) {
  const apiKey = process.env.GEMINI_API_KEY; // Read API key in .env file

  // If the .env file is missing or the key isn't set, stop immediately
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Check your .env file.');
  }

  // This is the Gemini REST API endpoint. The key is passed as a URL parameter.
  // gemini-2.0-flash is used because it is fast and free-tier friendly.
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Please simplify the following medical consent form text:\n\n${rawText}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2, // Low = more consistent, factual responses
      maxOutputTokens: 2048
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Gemini wraps the response in several layers — dig into it to get the text
  const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) {
    throw new Error('Unexpected Gemini response structure: ' + JSON.stringify(data));
  }

  // Gemini sometimes wraps JSON in markdown code fences (```json ... ```)
  // Strip those out before parsing
  const cleaned = rawContent.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Gemini did not return valid JSON. Raw output: ' + rawContent);
  }

  // Make sure the response has the two fields we expect
  if (typeof parsed.simplifiedText !== 'string' || !Array.isArray(parsed.detectedJargon)) {
    throw new Error('Gemini response is missing expected fields: ' + JSON.stringify(parsed));
  }

  return parsed;
}