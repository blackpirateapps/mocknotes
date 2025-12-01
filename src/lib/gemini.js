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
    Analyze the provided image(s) of a mock exam question. 

    TASKS:
    1. Extract the Question text, Options, and Explanation. In case of math extract EXACTLY accurate math question. 
    2. **FORMATTING:** You MUST preserve the visual structure of the question.
       - If the question contains statements (e.g., "Statement I:", "Statement II:"), put them on separate lines.
       - If there are lists or bullet points in the image, use Markdown lists.
       - If there are bold headers in the image, use Markdown bold (**text**).
       - Use double newlines (\\n\\n) to create visible paragraph breaks between distinct parts of the question.
    3. Identify the Correct Answer, Subject, and Topic.

    CRITICAL MATH FORMATTING RULES:
    - You MUST use LaTeX for all mathematical expressions.
    - Enclose INLINE math in single dollar signs (e.g., $x^2$).
    - Enclose BLOCK math in double dollar signs (e.g., $$ \\frac{a}{b} $$).
    - Output raw JSON. Double-escape backslashes for LaTeX (e.g., "\\\\frac").

    Return ONLY raw JSON:
    {
      "question": "The question text with **Markdown** formatting and $LaTeX$ math...",
      "options": ["Option A...", "Option B..."],
      "correctIndex": 0,
      "explanation": "Explanation with **Markdown** structure and math...",
      "subject": "Maths", 
      "topic": "Algebra"
    }
  `;

  // Create an array of image parts
  const imageParts = base64Images.map(img => ({
    inlineData: {
      data: img.split(',')[1],
      mimeType: "image/jpeg", 
    },
  }));

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    // Clean code fences if Gemini adds them
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Helpful error logging for JSON parsing issues
    if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON. Raw text received:", await (await model.generateContent([prompt, ...imageParts])).response.text());
    }
    throw error;
  }
}

export async function askGeminiFollowUp(history, newQuestion) {
    const API_KEY = getApiKey();
    if (!API_KEY) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const modelName = getModelId();
    
    // Add system instruction to maintain Math formatting in chat
    const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: "You are a helpful tutor. Always use LaTeX formatting for math equations, enclosed in single $ for inline and double $$ for block equations." 
    });
    
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(newQuestion);
    return result.response.text();
}