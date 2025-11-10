import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables.");
}

/**
 * A shared, reusable LangChain client configured for the Google Gemini API.
 */
export const llm = new ChatGoogleGenerativeAI({
    apiKey: GOOGLE_API_KEY,
    model: "gemini-1.5-flash", // gemini-2.5-pro - A fast and capable model suitable for these tasks
    maxOutputTokens: 512,
});