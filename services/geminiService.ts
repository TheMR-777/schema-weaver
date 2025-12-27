import { GoogleGenAI } from "@google/genai";
import { SchemaData } from '../types';

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const analyzeSchema = async (schema: SchemaData, userQuery: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Error: API Key not found. Please check your environment variables.";

  // Compress schema for prompt context
  const schemaSummary = schema.tables.map(t => 
    `Table: ${t.name}\nColumns: ${t.columns.map(c => c.name + '(' + c.type + ')' + (c.comment ? ' [' + c.comment + ']' : '')).join(', ')}`
  ).join('\n\n');

  const systemPrompt = `
    You are a Senior Database Architect and SQL Expert.
    You are analyzing a database schema provided by the user.
    
    Current Schema Context:
    ${schemaSummary}
    
    Answer the user's question based strictly on this schema. 
    If they ask for optimization, relationships, or business logic implied by the table names/comments, provide detailed, actionable advice.
    Use Markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to communicate with Gemini. Please try again.";
  }
};
