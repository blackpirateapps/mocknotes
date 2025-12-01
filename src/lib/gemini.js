import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key Management
export const getApiKey = () => localStorage.getItem('gemini_api_key') || "";
export const setApiKey = (key) => localStorage.setItem('gemini_api_key', key);

// Model Management
export const getModelId = () => localStorage.getItem('gemini_model_id') || "gemini-1.5-flash";
export const setModelId = (id) => localStorage.setItem('gemini_model_id', id);

// Fetch available models directly from REST API
export async function getAvailableModels() {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("API Key missing");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to fetch models");
  }

  const data = await response.json();
  
  // Filter for models that support content generation and are stable/latest
  return data.models
    .filter(m => 
      m.name.includes('gemini') && 
      m.supportedGenerationMethods.includes('generateContent')
    )
    .map(m => ({
      id: m.name.replace('models/', ''),
      displayName: m.displayName || m.name.replace('models/', ''),
      description: m.description
    }));
}

export async function analyzeImage(base64Image) {
  const API_KEY = getApiKey();
  if (!API_KEY) throw new Error("API Key missing. Please go to Settings.");

  const genAI = new GoogleGenerativeAI(API_KEY);
  // Use the selected model or default
  const modelName = getModelId();
  const model = genAI.getGenerativeModel({ model: modelName });

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
    const modelName = getModelId();
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(newQuestion);
    return result.response.text();
}