import { ChatOpenAI } from "@langchain/openai";
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
}

/**
 * A shared, reusable LangChain client configured for the OpenAI API.
 */
export const llm = new ChatOpenAI({
    openAIApiKey: OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo", // Fast and cost-effective for insights
    temperature: 0.7,
    maxTokens: 512,
});