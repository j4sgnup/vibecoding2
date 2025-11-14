// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables.");
}

// LangChain approach (commented out for testing)
// export const llm = new ChatGoogleGenerativeAI({
//     apiKey: GOOGLE_API_KEY,
//     model: "gemini-2.5-flash",
//     temperature: 0.7,
//     maxOutputTokens: 512,
// });

// Direct Google GenAI approach (active)
const geminiModels = [
    'gemini-2.5-flash', //works
    'gemini-2.0-flash-lite', //works
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'learnlm-2.0-flash-experimental',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-live',
    'gemini-2.5-flash-live'
]
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const modelName = geminiModels[1]
const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
        maxOutputTokens: 512, // Back to original
        temperature: 0.7 // Back to original
    }
});

export const llm = {
    async invoke(prompt: string) {
        try {
            console.log('Invoking with prompt:', prompt.substring(0, 100) + '...');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            // Detailed debugging
            console.log('Google GenAI result candidates:', result.response.candidates);
            console.log('Response finish reason:', result?.response?.candidates?.[0]?.finishReason||'finishreason[EMPTY]');
            console.log('Response content object:', result.response.candidates?.[0]?.content||'content[EMPTY]');
            console.log('Response parts:', result.response.candidates?.[0]?.content?.parts||'content->parts[EMPTY]');
            
            // Try to get text directly from parts
            const textContent = response.text();
            console.log('Text content result:', textContent);
            console.log('Text content length:', textContent.length);
            
            // Alternative way to get text
            if (!textContent && result.response.candidates?.[0]?.content?.parts) {
                const parts = result.response.candidates[0].content.parts;
                console.log('Trying alternative text extraction from parts:', parts);
                const altText = parts.map((part: any) => part.text).join('');
                console.log('Alternative text:', altText);
                return { content: altText };
            }
            
            return {
                content: textContent
            };
        } catch (error) {
            console.error('Error in llm.invoke:', error);
            throw error;
        }
    }
};