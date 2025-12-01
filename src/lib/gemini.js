import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key Management
export const getApiKey = () => localStorage.getItem('gemini_api_key') || "";
export const setApiKey = (key) => localStorage.setItem('gemini_api_key', key);

// Model Management
export const getModelId = () => localStorage.getItem('gemini_model_id') || "gemini-1.5-flash";
export const setModelId = (id) => localStorage.setItem('gemini_model_id', id);

// Fetch available models
export async function getAvailableModels() {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("API Key missing");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to fetch models");
  }
  const data = await response.json();
  return data.models
    .filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'))
    .map(m => ({
      id: m.name.replace('models/', ''),
      displayName: m.displayName || m.name.replace('models/', ''),
      description: m.description
    }));
}

// Updated to accept an array of base64 strings
export async function analyzeImage(base64Images) {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("API Key missing. Please go to Settings.");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const modelName = getModelId();
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
    Analyze the provided image(s) of a mock exam question. These images might contain the question, options, or the answer explanation. Treat them as a single context.

    TASKS:
    1. Extract the Question text, Options, and Explanation EXACTLY as they appear in the images. Do not paraphrase or summarize.
    2. Identify the Correct Answer.
    3. Classify the question into one of these 4 Subjects: "English", "Maths", "Reasoning", "GS".
    4. Identify the specific Topic (e.g., Algebra, Puzzles, Grammar, Polity).

    Return ONLY raw JSON with this structure:
    {
      "question": "Exact text from image",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Exact text from image",
      "subject": "Maths", 
      "topic": "Algebra"
    }
  `;

  // Create an array of image parts
  const imageParts = base64Images.map(img => ({
    inlineData: {
      data: img.split(',')[1],
      mimeType: "image/jpeg", // Assuming standardized to jpeg/png
    },
  }));

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
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
    const modelName = getModelId();
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(newQuestion);
    return result.response.text();
}