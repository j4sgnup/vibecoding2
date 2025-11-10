import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export const vendors = {
  HF: Symbol('huggingface'),
  GRQ: Symbol('groq')
}

const baseUrls = {
  huggingface: 'https://router.huggingface.co/v1',
  groq: 'https://api.groq.com/openai/v1'
}

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;
const GROQ_TOKEN = process.env.GROQ_API_KEY
// const defaultModel = 'HuggingFaceH4/zephyr-7b-beta:featherless-ai';
const defaultModel = 'llama3-8b-8192';

/**
 * Sends a prompt to the Hugging Face inference endpoint and returns the AI-generated response.
 * @param prompt - The natural language prompt to send.
 * @param model - Optional model override (defaults to Zephyr).
 * @returns AI-generated string response.
 */
export async function generateAIResponse(prompt: string, model = defaultModel, vendor = vendors.HF): Promise<string> {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables.');
  }

  // const openai = new OpenAI({
  //   apiKey: HF_TOKEN,
  //   baseURL: baseUrls.huggingface,
  // });
  const openai = new OpenAI({
    apiKey: GROQ_TOKEN,
    baseURL: baseUrls.groq,
  });

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model,
      max_tokens: 200,
      temperature: 0.7,
    });

    const message = chatCompletion.choices?.[0]?.message?.content;
    if (message) {
      return message.trim();
    } else {
      throw new Error('Unexpected response format from HF API.');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}
