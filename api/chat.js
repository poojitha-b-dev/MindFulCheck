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
            'https://api.openai.com/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map(m => ({
                            role: m.role === 'assistant' ? 'assistant' : 'user',
                            content: m.content
                        }))
                    ],
                    temperature: 0.8,
                    max_tokens: 512,
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenAI HTTP error:', response.status, JSON.stringify(data));
            throw new Error(`OpenAI returned ${response.status}: ${data?.error?.message}`);
        }

        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            console.error('No text in OpenAI response:', JSON.stringify(data));
            throw new Error('No response from OpenAI');
        }

        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        return res.status(200).json(parsed);
    } catch (err) {
        console.error('OpenAI error:', err);
        return res.status(200).json({
            message: "I'm here for you. Could you tell me a bit more about how you're feeling? 💙",
            quickReplies: ["I'm struggling", "I'm okay", "I need support"],
            intent: "fallback",
            sentiment: 0
        });
    }
}