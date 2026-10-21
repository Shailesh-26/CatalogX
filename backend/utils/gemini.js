const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});

async function generateContent(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in backend/.env");
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if ([429, 500, 503].includes(err.status) && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1)));
        continue;
      }

      throw err;
    }
  }
}

module.exports = { generateContent };