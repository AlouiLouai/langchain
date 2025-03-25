import axios from 'axios';
import { summarizeText } from '../utils/textSummerisation';

export async function analyzeCVWithLLM(cvText: string, jobDescription: string): Promise<string> {
    const apiKey = process.env.FORE_FRONT_API_KEY;
    if (!apiKey) {
        throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
    }

    const summarizedCV = summarizeText(cvText, 1000);
    const prompt = `
        Provide a structured qualitative assessment of how well the following CV matches this job description. Use this format:
        - **Summary**: Overall fit assessment (e.g., "Strong match", "Fairly good").
        - **Skills**: List relevant skills from the CV that match the job description.
        - **Experience**: Describe how the candidate's experience aligns with the job requirements.
        CV Content: ${summarizedCV}
        Job Description: ${jobDescription}
    `;

    const model = process.env.FORE_FRONT_MODEL
    const url = process.env.FORE_FRONT_BASE_URl
    const requestBody = {
        messages: [{ role: 'user', content: prompt }],
        model: model,
        max_tokens: 300, // Further reduced for speed
        temperature: 0.7,
    };

    const axiosInstance = axios.create({ timeout: 30000 });

    let retries = 2;
    while (retries > 0) {
        try {
            if(url){
                const response = await axiosInstance.post(url, requestBody, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                return response.data.choices?.[0]?.message?.content || 'No analysis returned';
            }
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