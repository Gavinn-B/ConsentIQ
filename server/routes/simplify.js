import { Router } from "express";
import upload from "../middleware/upload.js";
import { extractTextFromPdf } from "../utils/pdfParser.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/simplify", upload.single('file'), async (req, res) => {
    try {
        let rawText = '';

        if (req.file) {
            rawText = await extractTextFromPdf(req.file.buffer);
        } else if (req.body.text) {
            rawText = req.body.text;
        } else {
            return res.status(400).json({ error: 'No file or text provided' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are helping patients understand a medical consent form.

Given the following consent form text, return a JSON object with two fields:
1. "plain": an array of strings, where each string is a paragraph rewritten in simple, plain English that anyone can understand. Wrap any medical jargon terms with double underscores like __this__.
2. "jargon": an object where each key is a jargon term (matching what you wrapped in __) and the value is a simple one-sentence definition.

Only return valid JSON. No markdown, no code blocks, just the raw JSON.

Consent form text:
${rawText}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            // Gemini sometimes wraps in markdown code blocks, strip them
            const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            parsed = JSON.parse(cleaned);
        }

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to simplify document' });
    }
});

export default router;
