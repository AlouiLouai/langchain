import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

function summarizeText(text: string, maxLength: number = 1000): string {
    const sentences = text.split('\n').filter(line => line.trim());
    let summary = '';
    for (const sentence of sentences) {
        if (summary.length + sentence.length <= maxLength) {
            summary += sentence + ' ';
        } else {
            break;
        }
    }
    return summary.trim() || text.substring(0, maxLength);
}

export async function analyzeCVWithLLM(cvText: string, jobDescription: string): Promise<string> {
    const apiKey = process.env.FORE_FRONT_API_KEY;
    if (!apiKey) {
        throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
    }

    const summarizedCV = summarizeText(cvText, 1000);
    const prompt = `
        Provide a concise qualitative assessment of how well the following CV matches this job description.
        CV Content: ${summarizedCV}
        Job Description: ${jobDescription}
    `;

    const url = 'https://api.forefront.ai/v1/chat/completions';
    const requestBody = {
        messages: [{ role: 'user', content: prompt }],
        model: 'mistralai/Mistral-7B-v0.1',
        max_tokens: 150, // Further reduced for speed
        temperature: 0.7,
    };

    const axiosInstance = axios.create({ timeout: 30000 });

    let retries = 2;
    while (retries > 0) {
        try {
            const response = await axiosInstance.post(url, requestBody, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.choices?.[0]?.message?.content || 'No analysis returned';
        } catch (error) {
            if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
                retries--;
                if (retries === 0) {
                    throw new Error('LLM analysis failed: Request timed out after retries');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (axios.isAxiosError(error)) {
                throw new Error(`LLM analysis failed: ${error.response?.data?.error?.message || error.message}`);
            } else {
                throw new Error(`LLM analysis failed: ${(error as Error).message}`);
            }
        }
    }
    throw new Error('LLM analysis failed: Unexpected retry loop exit');
}