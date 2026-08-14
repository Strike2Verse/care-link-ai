// const express = require('express');
// const { protect } = require('../middleware/authMiddleware');
// const router = express.Router();
// const multer = require('multer');
// const upload = require('../middleware/upload'); 
// const axios = require('axios');
// const VISION_API_KEY = process.env.VISION_API_KEY;


// async function ocrImage(base64Image) {
//   const requestBody = {
//     requests: [
//       {
//         image: { content: base64Image },
//         features: [{ type: 'TEXT_DETECTION' }],
//       },
//     ],
//   };
//   const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
//   const { data } = await axios.post(url, requestBody);
//   const annotations = data.responses?.[0]?.textAnnotations;
//   if (!annotations || annotations.length === 0) {
//     return null; // no text found
//   }
//   return annotations[0].description;
// }

// // Clean OCR output according to pro‑tips
// function cleanOcrText(text) {
//   if (!text) return '';
//   return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
// }

// // Stub for fetching medication info – replace with real service later
// async function fetchMedicineInfo(query) {
//   // For demo purposes we just echo back the query
//   return {
//     name: query,
//     description: 'Medication details not yet integrated.',
//   };
// }

// // @desc    Scan pill image and return medication data
// // @route   POST /api/scan/pill
// // @access  Private (uses same auth middleware as other routes)
// router.post('/pill', protect, upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No image provided.' });
//     }
//     const imageBuffer = req.file.buffer || require('fs').readFileSync(req.file.path);
//     const base64Image = imageBuffer.toString('base64');
//     const rawText = await ocrImage(base64Image);
//     if (!rawText) {
//       // OCR found no text – fallback to manual search
//       return res.json({ fallback: true, message: 'No text detected.' });
//     }
//     const cleaned = cleanOcrText(rawText);
//     if (!cleaned) {
//       return res.json({ fallback: true, message: 'Unable to extract usable text.' });
//     }
//     const medInfo = await fetchMedicineInfo(cleaned);
//     return res.json({ success: true, medicine: medInfo });
//   } catch (err) {
//     console.error('Pill scan error:', err);
//     // Detect typical Vision errors (e.g., blurry image) and give user‑friendly message
//     return res.status(500).json({ message: 'Please scan clearly', error: err.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/authMiddleware');

// ✅ Use memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to format image buffer for Gemini API
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType
    },
  };
}

// 🚀 Main route (Gemini 2.5 Flash Multimodal OCR & Scan)
router.post('/pill', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype || 'image/jpeg');

    const prompt = `You are a medical scanner AI assistant. Analyze this image of a pill or pill bottle.
Identify the medication name (brand or generic), dosage/strength (e.g. 500mg, 10mg), and key indications or uses.
Pay close attention to any text, label numbers, or imprints visible.

Return a JSON object in this exact format:
{
  "name": "Medication Name (or null if not identified)",
  "dosage": "Dosage/Strength (or null if not identified)",
  "description": "Short explanation of uses and indications (or null if not identified)"
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log('📄 Raw Gemini OCR Response:', responseText);

    let parsedResult;
    try {
      const cleanJson = responseText.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', parseErr);
      return res.json({ fallback: true, message: 'Could not parse scanner response' });
    }

    if (!parsedResult || !parsedResult.name) {
      return res.json({ fallback: true, message: 'No medication identified in the image.' });
    }

    return res.json({
      success: true,
      medicine: {
        name: parsedResult.name,
        dosage: parsedResult.dosage || '',
        description: parsedResult.description || 'No description found'
      }
    });

  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({
      message: 'Scan failed',
      error: err.message,
    });
  }
});

module.exports = router;