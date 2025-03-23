import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export async function analyzeCVWithLLM(cvText: string, jobDescription: string): Promise<string> {
    const apiKey = process.env.FORE_FRONT_API_KEY;
    if (!apiKey) {
        throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
    }

    const prompt = `
        Analyze the following CV content and determine if it matches this job description.
        CV Content: ${cvText}
        Job Description: ${jobDescription}
        Provide a detailed assessment of the candidate's suitability for the position.
    `;

    const url = 'https://api.forefront.ai/v1/chat/completions';
    const requestBody = {
        messages: [
            { role: 'user', content: prompt },
        ],
        model: 'mistralai/Mistral-7B-v0.1', // Updated to match Forefront's official example
        max_tokens: 500, // Increased from docs' 128 for more detailed analysis
        temperature: 0.7, // Optional, kept for consistency
    };

    console.log('Request URL:', url);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    try {
        const response = await axios.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Response Data:', response.data);
        // Chat completions response uses choices[0].message.content
        return response.data.choices?.[0]?.message?.content || 'No analysis returned';
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
            throw new Error(
                `LLM analysis failed: ${error.response?.data?.error?.message || error.message}`
            );
        }
        throw new Error(`LLM analysis failed: ${(error as Error).message}`);
    }
}