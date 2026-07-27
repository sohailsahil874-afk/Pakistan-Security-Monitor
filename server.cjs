const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Log every request so we can see if the button is reaching the server
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// AI STRATEGIC BRIEFING ENDPOINT
app.post('/api/analyze', async (req, res) => {
  console.log('AI endpoint hit! Processing briefing...');
  
  const { incidents } = req.body;
  
  if (!incidents || incidents.length === 0) {
    return res.json({ briefing: 'No incidents available to analyze.' });
  }

  const systemPrompt = `You are a senior Pakistan security affairs analyst with 20 years of experience. Analyze the provided security incidents and produce a concise strategic briefing (max 350 words) with these sections:

1. SITUATION OVERVIEW
2. KEY ACTORS
3. REGIONAL HOTSPOTS
4. TREND ANALYSIS
5. STRATEGIC OUTLOOK (next 48-72 hours)

Rules: Be factual. Use professional intelligence tone. Do NOT invent incidents not in the data.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: systemPrompt + '\n\nINCIDENTS:\n' + JSON.stringify(incidents.slice(0, 15)) }] 
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.3 }
        })
      }
    );

    const data = await response.json();
    
    // Log what Gemini returned (for debugging)
    console.log('Gemini response status:', response.status);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis currently unavailable.';
    res.json({ briefing: text });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ briefing: 'Error generating briefing. Please try again.' });
  }
});

// Serve the built website files
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: send everything else to the homepage
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));