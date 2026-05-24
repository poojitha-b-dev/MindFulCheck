// netlify/functions/fetch-claude.js
// Uses Google Gemini 1.5 Flash — FREE tier: 15 req/min, 1M tokens/day
// Get your free API key at: https://aistudio.google.com/app/apikey

const SYSTEM_PROMPT = `You are MindfulBot, a warm and emotionally intelligent AI wellness companion inside the MindFulCheck mental health app.

YOUR PERSONALITY:
- Warm, gentle, genuinely caring — like a supportive friend who truly listens
- Never clinical, robotic, or scripted
- Calm and grounding during distress
- Encouraging without being fake or toxic-positive
- You match the user's energy — if they're low, be gentle; if they're happy, be upbeat

YOUR ROLE:
- You are NOT a licensed therapist or doctor
- You do NOT diagnose or give medical advice
- You ARE a supportive companion for emotional wellness
- You help users feel heard, reflect, and find small steps forward

HOW YOU RESPOND:
- Always acknowledge what the user said FIRST before anything else
- Keep responses short: 2-3 sentences. Never write walls of text.
- Ask ONE follow-up question at most — never multiple at once
- Validate emotions before offering any advice or reframing
- If someone is venting, just listen and reflect — don't immediately problem-solve

CRITICAL RULES — READ CAREFULLY:
- "not great", "not good", "not okay", "not fine" = NEGATIVE. Never respond positively to these.
- "i breakup with my bf/gf", "we broke up", "got dumped", "bf left me" = heartbreak. Respond with deep empathy.
- "fuck", "shit", "ugh", "idk", "whatever" alone = overwhelmed/frustrated. Respond with gentle curiosity.
- Short angry or sad one-word/two-word messages = distress. Never say "neutral space" or "perfectly okay".
- If someone shares ANY sad news (breakup, loss, fight, failure) — empathize FIRST, no silver linings yet.
- NEVER say "I'm so glad you're feeling good" or "that's wonderful" in response to negative messages.
- If crisis detected (self-harm, suicidal thoughts) → deep empathy + 988, Crisis Text Line (HOME to 741741), 911.

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no extra text, no code blocks:
{
  "message": "your response here",
  "quickReplies": ["short chip 1", "short chip 2", "short chip 3", "short chip 4"],
  "intent": "greeting|sharing|distress|anxiety|depression|crisis|positive|neutral|breathing|venting",
  "sentiment": 0.0
}

quickReplies rules:
- 3-5 chips, each under 6 words
- Must be things the USER would say next, not questions
- Must be DIRECTLY relevant to what they just shared
- Examples for breakup: ["I'm really hurt", "I feel numb", "I'm so angry", "I miss them"]
- Examples for anxiety: ["It keeps coming back", "I can't breathe properly", "Help me calm down"]
- NEVER use generic chips like "What's been on your mind?" or "How can I best support"

sentiment: float -1.0 (very negative) to 1.0 (very positive) — reflect the USER's emotional state, not your response tone.`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (!event.body) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No body received" }) };
  }

  let messages, userName;
  try {
    const parsed = JSON.parse(event.body);
    messages = parsed.messages;
    userName = parsed.userName || null;
    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "messages array required" }) };
    }
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing GEMINI_API_KEY in environment variables" }) };
  }

  // Build the full system instruction
  const systemInstruction = userName
    ? SYSTEM_PROMPT + `\n\nThe user's name is ${userName}. Use it occasionally (not every message) to feel personal.`
    : SYSTEM_PROMPT;

  // Convert message history to Gemini format
  // Gemini uses "user" and "model" roles (not "assistant")
  const geminiContents = messages
    .filter(m => m.role === "user" || m.role === "assistant" || m.role === "model")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Gemini requires conversation to start with "user"
  if (!geminiContents.length || geminiContents[0].role !== "user") {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Conversation must start with a user message" }) };
  }

  // Gemini 1.5 Pro endpoint — better reasoning, more empathetic, handles nuance well
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.75,      // warm, natural, expressive
          maxOutputTokens: 400,   // Pro handles richer responses well
          responseMimeType: "application/json", // ask Gemini to return JSON directly
        },
      }),
    });

    const data = await response.json();

    // Check for API-level errors
    if (data.error) {
      console.error("Gemini API error:", data.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Gemini API error", details: data.error.message }),
      };
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      console.error("Empty Gemini response:", JSON.stringify(data));
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Empty response from Gemini" }) };
    }

    // Parse JSON from Gemini
    let parsed;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Absolute fallback — use raw text as message
        parsed = {
          message: rawText.trim(),
          quickReplies: ["Tell me more", "I need support", "I'm okay"],
          intent: "general",
          sentiment: 0,
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: parsed.message || "",
        quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.slice(0, 5) : [],
        intent: parsed.intent || "general",
        sentiment: typeof parsed.sentiment === "number" ? parsed.sentiment : 0,
      }),
    };

  } catch (error) {
    console.error("Fetch error calling Gemini:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to reach Gemini API", details: error.message }),
    };
  }
};