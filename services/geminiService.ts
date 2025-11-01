
import { GoogleGenAI, type Content, type Part, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Assume process.env.API_KEY is configured in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll throw an error if the key is missing.
  throw new Error("API_KEY is not configured in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

function dataUrlToGoogleGenerativeAI_Part(dataUrl: string): Part {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const mimeType = match[1];
  const base64Data = match[2];
  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

// History will be text-only for simplicity of this feature
export async function sendMessageToGeminiStream(
    message: string,
    history: Content[],
    image?: string | null
) {
    const modelName = 'gemini-2.5-flash';
    
    const userParts: Part[] = [];
    if (image) {
      userParts.push(dataUrlToGoogleGenerativeAI_Part(image));
    }
    userParts.push({ text: message });
    
    const contents: Content[] = [...history, { role: 'user', parts: userParts }];

    const response = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{googleSearch: {}}],
      }
    });

    return response;
}


export async function generateSpeechFromText(text: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
}
