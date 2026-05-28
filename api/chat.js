export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { messages, userName } = req.body;
    const systemPrompt = `You are MindfulBot, a warm, empathetic mental wellness companion built into MindfulCheck, a mental health app. Your role is to provide emotional support, psychoeducation, and gentle guidance — never clinical diagnosis. Guidelines: Be warm, human, concise. For anxiety offer grounding techniques. For depression validate feelings. Never diagnose. If crisis detected mention 988. Always return JSON with: message, quickReplies (array of 3-5 short strings), intent (string), sentiment (number -1 to 1). ${userName ? `The user's name is ${userName}` : ''} Return ONLY valid JSON. Format: {"message": "...", "quickReplies": ["...", "..."], "intent": "...", "sentiment": 0.0}`;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
                ],
                temperature: 0.8,
                max_tokens: 512,
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(`Groq returned ${response.status}: ${data?.error?.message}`);
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('No response from Groq');
        const jsonMatch = text.match(/\{[\s\S]*\}/); if (!jsonMatch) throw new Error("No JSON in response"); const clean = jsonMatch[0].trim();
        const parsed = JSON.parse(clean);
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

