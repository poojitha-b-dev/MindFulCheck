type Role = "user" | "bot";

const questions = [
  "How has your **sleep** been recently? (good / bad)",
  "How is your **appetite**? (normal / low)",
  "Have you been feeling **sad** often? (yes / no)",
  "Are you still **interested** in things you used to enjoy? (yes / no)",
  "How is your **energy** level? (normal / low)",
];

const expectedAnswers = [
  ["good", "bad"],
  ["normal", "low"],
  ["yes", "no"],
  ["yes", "no"],
  ["normal", "low"],
];

// Simple scoring keywords
const scoringMap = [
  { badWords: ["bad"], score: 1 },
  { badWords: ["low"], score: 1 },
  { badWords: ["yes"], score: 1 },
  { badWords: ["no"], score: 1 },
  { badWords: ["low"], score: 1 },
];

export async function processChatMessage(
  conversation: { role: Role; content: string }[]
): Promise<string> {
  // Get bot’s memory: answers so far
  const botMemory = conversation.filter(
    (msg) => msg.role === "bot" && msg.content.startsWith("Q")
  ).length;

  const userAnswers = conversation.filter((msg) => msg.role === "user");

  const currentQuestionIndex = userAnswers.length;

  // If not enough answers yet
  if (currentQuestionIndex < questions.length) {
    const userInput = conversation[conversation.length - 1].content.trim().toLowerCase();
    const validOptions = expectedAnswers[currentQuestionIndex];

    // Check if user input is one of the expected values
    if (!validOptions.includes(userInput)) {
      return `🤔 I didn't quite get that. Please reply with one of: **${validOptions.join(" / ")}**`;
    }

    // Ask the next question
    const nextQuestion = questions[currentQuestionIndex];
    return `Q${currentQuestionIndex + 1}: ${nextQuestion}`;
  }

  // All answers are collected — compute risk
  const answersOnly = userAnswers.map((msg) => msg.content.toLowerCase());
  let score = 0;

  answersOnly.forEach((answer, i) => {
    const { badWords, score: s } = scoringMap[i];
    if (badWords.includes(answer)) {
      score += s;
    }
  });

  if (score <= 1) {
    return "🟢 **Low risk**: You're doing well. Keep up your good habits! 😊";
  } else if (score <= 3) {
    return "🟠 **Medium risk**: Consider some mindfulness, physical activity, or talking to someone. 🧘‍♂️";
  } else {
    return "🔴 **High risk**: It might help to talk with a mental health professional. You're not alone. ❤️‍🩹";
  }
}
