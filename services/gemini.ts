import { GoogleGenAI } from "@google/genai";

export const generateAIResponse = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    // Mock response if no API key is present (safe fallback for demo)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`[MOCK AI RESPONSE] You said: "${prompt}".\n\n(To get real responses, please provide a valid Gemini API Key)`);
      }, 1000);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again.";
  }
};