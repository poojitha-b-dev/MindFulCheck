export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, userName } = req.body;

    const systemPrompt = `You are MindfulBot, a warm, empathetic mental wellness companion. Provide emotional support and gentle guidance.
Guidelines:
- Be warm, concise (2-4 sentences max)
- For anxiety: offer grounding/breathing techniques
- For depression/sadness: validate feelings, offer small steps
- Never diagnose or prescribe
- If crisis detected, mention 988 and crisis text line
${userName ? `- The user's name is ${userName}` : ''}
You MUST respond with ONLY a raw JSON object. No markdown, no backticks, no explanation before or after.
Example: {"message": "I hear you.", "quickReplies": ["Tell me more", "I need help"], "intent": "support", "sentiment": -0.5}`;

    try {
        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama3-70b-8192',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map(m => ({
                            role: m.role === 'assistant' ? 'assistant' : 'user',
                            content: m.content
                        }))
                    ],
                    temperature: 0.7,
                    max_tokens: 300,
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Groq HTTP error:', response.status, JSON.stringify(data));
            throw new Error(`Groq returned ${response.status}: ${data?.error?.message}`);
        }

        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            console.error('No text in Groq response:', JSON.stringify(data));
            throw new Error('No response from Groq');
        }

        console.log('Groq raw response:', text);

        // Extract JSON from response - handles cases where model adds extra text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', text);
            throw new Error('No JSON in Groq response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return res.status(200).json(parsed);

    } catch (err) {
        console.error('Groq error:', err);
        return res.status(200).json({
            message: "I'm here for you. Could you tell me a bit more about how you're feeling? 💙",
            quickReplies: ["I'm struggling", "I'm okay", "I need support"],
            intent: "fallback",
            sentiment: 0
        });
    }
}