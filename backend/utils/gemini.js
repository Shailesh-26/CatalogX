const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
});

async function generateContent(prompt) {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (err.status === 503 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }

      throw err;
    }
  }
}

module.exports = { generateContent };