const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Log the incoming event
  console.log("Received event:", event);

  // Check if body exists
  if (!event.body) {
    console.error("No body received");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No body received" }),
    };
  }

  // Parse the body
  let messages;
  try {
    const parsed = JSON.parse(event.body);
    messages = parsed.messages;
    if (!messages) {
      console.error("No 'messages' field in body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No 'messages' field in body" }),
      };
    }
  } catch (err) {
    console.error("Invalid JSON body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  // Clean up messages: remove any without content
  messages = messages.filter(msg => msg.content !== undefined && msg.content !== null);
  console.log("Messages after cleanup:", messages);

  // Ensure at least one user message
  if (!messages.some(msg => msg.role === 'user')) {
    console.error("No user message in conversation");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No user message in conversation" }),
    };
  }

  // Get OpenAI API key
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey) {
    console.error("Missing OPENAI_API_KEY");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
    };
  }

  // Call OpenAI API
  try {
    console.log("Calling OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 200
      })
    });

    console.log("OpenAI response status:", response.status);

    const data = await response.json();
    console.log("OpenAI response data:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response from OpenAI:", data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid response from OpenAI", details: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content })
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch from OpenAI API', details: error.message })
    };
  }
};
