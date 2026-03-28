import { Router } from "express";
import upload from "../middleware/upload.js";
import { extractTextFromPdf } from "../utils/pdfParser.js";

const router = Router();

router.post("/simplify", upload.single('file'), async (req, res) => {
    try{
        let rawText = '';

        if(req.file){
            // PDF path 
            rawText = await extractTextFromPdf(req.file.buffer);
        } else if (req.body.text){
            // plain text path 
            rawText = req.body.text;
        } else {
            return res.status(400).json({ error: 'No file or text provided' });
        }
        // TODO: call gemini api 
        // const simplify = await 
        res.json({ 
            rawText,          // confirms pdf/text parsed correctly
            summary: 'MOCK SUMMARY - Gemini not connected yet' 
        });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: 'Failed to simplify PDF' });
    };

    
    
    
});

// TODO: implement gemini api call to get key terms and generate quiz
export default router;