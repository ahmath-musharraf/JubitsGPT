import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Attachment } from "../types";

// Lazy initialize the client to prevent startup crashes
let aiClient: GoogleGenAI | null = null;

export const getStoredApiKey = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
  }
  return process.env.API_KEY || '';
};

export const setStoredApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', key);
    aiClient = null; // Force re-init with new key
  }
};

const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      throw new Error("API Key is missing. Please set your API Key in settings.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// We maintain a reference to the active chat session and its model
let chatSession: Chat | null = null;
let currentModel: string = 'gemini-2.5-flash';

const DEFAULT_SYSTEM_INSTRUCTION = "You are JubitsGPT, a highly advanced, witty, and helpful AI assistant. You provide concise, accurate answers and can format code beautifully using Markdown.";
const CODE_SYSTEM_INSTRUCTION = "You are JubitsGPT, an expert software engineer and coding assistant. You provide clean, efficient, secure, and well-documented code. You explain complex concepts simply and prefer modern best practices.";

export const initializeChat = (model: string = 'gemini-2.5-flash', history?: any[]) => {
  const ai = getAiClient();
  const systemInstruction = model === 'gemini-3-pro-preview' ? CODE_SYSTEM_INSTRUCTION : DEFAULT_SYSTEM_INSTRUCTION;
  
  chatSession = ai.chats.create({
    model: model,
    config: {
      systemInstruction: systemInstruction,
    },
    history: history
  });
  currentModel = model;
  return chatSession;
};

export const getChatSession = async (desiredModel: string = 'gemini-2.5-flash') => {
  // If we have a session but need to switch models
  if (chatSession && currentModel !== desiredModel) {
    // Attempt to preserve history
    try {
      const history = await chatSession.getHistory();
      return initializeChat(desiredModel, history);
    } catch (e) {
      console.warn("Failed to preserve history during model switch, starting fresh.", e);
      return initializeChat(desiredModel);
    }
  }

  if (!chatSession) {
    return initializeChat(desiredModel);
  }

  return chatSession;
};

export const sendMessageStream = async (message: string, attachments?: Attachment[], model: string = 'gemini-2.5-flash'): Promise<AsyncIterable<GenerateContentResponse>> => {
  const session = await getChatSession(model);
  try {
    let messageContent: any = message;

    // If we have attachments, we need to construct a multipart message
    if (attachments && attachments.length > 0) {
      const parts: any[] = [];

      // Add text part if it exists
      if (message.trim()) {
        parts.push({ text: message });
      }

      // Add attachment parts
      attachments.forEach((att) => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });

      messageContent = parts;
    }

    // The SDK accepts string or Part[] in the message field
    const response = await session.sendMessageStream({ message: messageContent });
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateImageContent = async (prompt: string): Promise<{ text: string, attachments: Attachment[] }> => {
  const ai = getAiClient();
  // Always use flash image for Nano Banana
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    }
  });

  const attachments: Attachment[] = [];
  let text = '';

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        attachments.push({
          type: 'image',
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data,
          name: `generated-image-${Date.now()}.png`
        });
      } else if (part.text) {
        text += part.text;
      }
    }
  }

  return { text, attachments };
};

export const generateVideoContent = async (prompt: string): Promise<{ text: string, attachments: Attachment[] }> => {
  // Check for Veo key selection
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }

  // Create a new instance to ensure the latest API key is used
  // Note: For Veo, we typically rely on the external key selector, but here we pass the current key context
  const apiKey = getStoredApiKey();
  const veoAi = new GoogleGenAI({ apiKey });

  let operation = await veoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await veoAi.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!videoUri) {
    throw new Error("Failed to generate video.");
  }

  const response = await fetch(`${videoUri}&key=${apiKey}`);
  if (!response.ok) throw new Error("Failed to download video.");
  
  const blob = await response.blob();
  const base64Data = await blobToBase64(blob);

  return {
    text: "Video generated successfully.",
    attachments: [{
      type: 'video',
      mimeType: 'video/mp4',
      data: base64Data,
      name: `generated-video-${Date.now()}.mp4`,
      size: blob.size,
      lastModified: Date.now()
    }]
  };
};

export const generateSummary = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Please provide a concise summary of the following text:\n\n${text}`,
  });
  return response.text || "No summary generated.";
};

/**
 * Creative feature: Enhances a simple user prompt into a detailed one.
 */
export const enhancePrompt = async (input: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a prompt engineer. Rewrite the following user prompt to be more descriptive, creative, and optimized for an AI model. 
    If it's for an image, describe lighting, style, and mood. 
    If it's for code, specify clarity and efficiency.
    If it's for chat, make it clear and engaging.
    
    Just return the enhanced prompt text without any preamble.
    
    Original Prompt: ${input}`,
  });
  return response.text || input;
};
