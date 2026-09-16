// api/generate.js
// Ye Vercel Serverless Function hai
// API key yahan safe rahegi — frontend mein nahi jayegi

export default async function handler(req, res) {

  // Sirf POST allow karo
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userInput } = req.body;

    // Input check
    if (!userInput || userInput.trim().length < 3) {
      return res.status(400).json({ error: 'Input too short' });
    }

    // API key Vercel environment se aayegi — safe hai
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured on server'
      });
    }

    // AI Prompt
    const prompt = `You are an expert YouTube SEO specialist.

A user has a YouTube video with this title/topic:
"${userInput}"

Your job is to generate TWO things:

1. Exactly 20 highly relevant YouTube video tags
2. A well-written, SEO-friendly YouTube video description

RULES FOR TAGS:
- Exactly 20 tags
- All tags must be relevant to the video topic
- Mix short-tail (1-2 words) and long-tail (3-5 words)
- Lowercase only
- No hashtags, quotes, or special characters
- No duplicate tags

RULES FOR DESCRIPTION:
- Write a natural, useful, SEO-friendly YouTube description
- Length: between 800 and 3000 characters
- Never exceed 4500 characters
- Start with a strong 2-3 line opening
- Naturally include the main keyword from the title
- Use short paragraphs for readability
- Use bullet points when appropriate
- Include a simple CTA (like, subscribe, comment)
- Do NOT invent specific facts not in the title
- Do NOT make fake claims
- Do NOT use excessive emojis (max 3-4 total)
- Do NOT keyword-stuff
- Write for humans first

RESPONSE FORMAT:
Return ONLY valid JSON. No extra text. No markdown. No code fences.

{"tags":["tag one","tag two","tag three","tag four","tag five","tag six","tag seven","tag eight","tag nine","tag ten","tag eleven","tag twelve","tag thirteen","tag fourteen","tag fifteen","tag sixteen","tag seventeen","tag eighteen","tag nineteen","tag twenty"],"description":"Your full description text here"}`;

    // Groq API call
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model:       'llama-3.1-8b-instant',
          max_tokens:  1500,
          temperature: 0.7,
          messages: [
            {
              role:    'user',
              content: prompt,
            }
          ],
        }),
      }
    );

    // Groq error handle karo
    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}));
      const status  = groqResponse.status;

      if (status === 401) {
        return res.status(401).json({ error: 'invalid_key' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'rate_limit' });
      }

      return res.status(status).json({
        error: errData?.error?.message || 'Groq API error'
      });
    }

    const groqData = await groqResponse.json();
    const rawText  = groqData?.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      return res.status(500).json({ error: 'empty_response' });
    }

    // JSON parse karo
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // JSON ke andar se nikalo
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          return res.status(500).json({ error: 'parse_error' });
        }
      } else {
        return res.status(500).json({ error: 'parse_error' });
      }
    }

    // Validate
    if (!parsed.tags || !Array.isArray(parsed.tags)) {
      return res.status(500).json({ error: 'no_tags' });
    }

    if (!parsed.description || parsed.description.length < 50) {
      return res.status(500).json({ error: 'no_description' });
    }

    // Description limit check
    if (parsed.description.length > 4500) {
      parsed.description = parsed.description.substring(0, 4500);
      const lastPeriod = parsed.description.lastIndexOf('.');
      if (lastPeriod > 3000) {
        parsed.description = parsed.description.substring(0, lastPeriod + 1);
      }
    }

    // Success — frontend ko bhejo
    return res.status(200).json({
      tags:        parsed.tags,
      description: parsed.description,
    });

  } catch (err) {
    console.error('[TagsAI API] Error:', err);
    return res.status(500).json({
      error: 'server_error: ' + err.message
    });
  }
}
