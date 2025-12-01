import { GoogleGenerativeAI } from "@google/generative-ai";

export const getApiKey = () => localStorage.getItem('gemini_api_key') || "";
export const setApiKey = (key) => localStorage.setItem('gemini_api_key', key);

export async function analyzeImage(base64Image) {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("API Key missing. Please go to Settings.");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this image of a mock exam question. 
    Extract the Question text, the Options, and identify the Correct Answer.
    Provide a detailed explanation for why the answer is correct.
    
    Return ONLY raw JSON (no markdown formatting) with this specific structure:
    {
      "question": "The question text found in the image",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0,
      "explanation": "Detailed explanation here."
    }
  `;

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1],
      mimeType: "image/jpeg",
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function askGeminiFollowUp(history, newQuestion) {
    const API_KEY = getApiKey();
    if (!API_KEY) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(newQuestion);
    return result.response.text();
}