import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();


const HF_TOKEN = process.env.HUGGINGFACE_API_KEY
// const defaultModel = 'zai-org/GLM-4.5:novita'
const defaultModel = 'HuggingFaceH4/zephyr-7b-beta:featherless-ai'

export async function generateReminderMessage(name: string, orgName: string, model = defaultModel): Promise<string> {
  

  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables.');
  }

  const openai = new OpenAI({
    apiKey: HF_TOKEN,
    baseURL: "https://router.huggingface.co/v1"
  });

  // const prompt = `Write a friendly reminder email to ${name} who was invited to join ${orgName} but hasn’t opened the invite in over 3 days. This is a professional business. .`;
  const prompt = `Write a short, friendly reminder email to ${name}, who was invited to join ${orgName}, a digital platform for managing organizational accounts and services. They haven’t opened the invite in over 3 days. Keep it under 50 words.`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model,
      max_tokens: 150, // limit response length
      temperature: 0.7 //. creativity level
    });

    if (chatCompletion.choices && chatCompletion.choices.length > 0 && chatCompletion.choices[0].message && chatCompletion.choices[0].message.content) {
      return chatCompletion.choices[0].message.content;
    } else {
      throw new Error('Unexpected response format from HF API.');
    }
  } catch (error) {
    console.error('Error generating reminder message:', error);
    throw error;
  }
}