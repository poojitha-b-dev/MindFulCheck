export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, userName } = req.body;

    const systemPrompt = `You are MindfulBot, a warm, empathetic mental wellness companion built into MindfulCheck, a mental health app. Your role is to provide emotional support, psychoeducation, and gentle guidance — never clinical diagnosis.
  
  Guidelines:
  - Be warm, human, concise (2-4 sentences max per reply)
  - Detect emotional tone and respond with empathy first
  - For anxiety: offer grounding/breathing techniques
  - For depression/sadness: validate feelings, offer small actionable steps
  - Never diagnose or prescribe
  - If crisis detected, always mention 988 and crisis text line
  - Always return JSON with: message, quickReplies (array of 3-5 short strings), intent (string), sentiment (number -1 to 1)
  ${userName ? `- The user's name is ${userName}` : ''}
  
  Return ONLY valid JSON, no markdown, no explanation. Format:
  {"message": "...", "quickReplies": ["...", "..."], "intent": "...", "sentiment": 0.0}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    })),
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 512,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini HTTP error:', response.status, JSON.stringify(data));
            throw new Error(`Gemini returned ${response.status}: ${data?.error?.message}`);
        }

        if (data.promptFeedback?.blockReason) {
            console.error('Gemini blocked prompt:', data.promptFeedback.blockReason);
            throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('No text in Gemini response:', JSON.stringify(data));
            throw new Error('No response from Gemini');
        }

        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        return res.status(200).json(parsed);
    } catch (err) {
        console.error('Gemini error:', err);
        return res.status(200).json({
            message: "I'm here for you. Could you tell me a bit more about how you're feeling? 💙",
            quickReplies: ["I'm struggling", "I'm okay", "I need support"],
            intent: "fallback",
            sentiment: 0
        });
    }
}
