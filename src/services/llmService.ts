import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ForefrontLLM } from '../llms/forefrontLLM';
import { StringOutputParser } from '@langchain/core/output_parsers';

export async function analyzeCVWithLLM(cvText: string, jobDescription: string): Promise<{ analysis: string; fitPercentage: number }> {
    const apiKey = process.env.FORE_FRONT_API_KEY;
    if (!apiKey) {
        throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
    }

    const llm = new ForefrontLLM(apiKey);

    // Define the prompt as a message array
    const promptTemplate = ChatPromptTemplate.fromMessages([
        ['human', `
            You are an expert recruiter analyzing a CV against a job description. Provide a structured assessment in this format:
            - **Summary**: Overall fit (e.g., "Strong match", "Fairly good", "Poor match").
            - **Skills Match**: List skills from the CV that match the job description and note any missing skills.
            - **Experience Match**: Assess how the candidate's experience aligns with the job requirements.
            - **Fit Score**: Estimate a fit percentage (0-100) based on skills, experience, and relevance.

            CV Content: {cvText}
            Job Description: {jobDescription}
        `]
    ]);

    // Create a chain: prompt -> LLM -> output parser
    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

    // Execute the chain
    const rawAnalysis = await chain.invoke({ cvText, jobDescription });

    // Parse the response to extract fit percentage
    const fitMatch = rawAnalysis.match(/Fit Score.*?(\d+)/i);
    const fitPercentage = fitMatch ? Math.min(parseInt(fitMatch[1]), 100) : 50; // Default to 50 if not found

    // Clean the analysis of any unwanted markers
    const cleanAnalysis = rawAnalysis.replace(/<\|im_end\|>|<\|im_start\|>|\s*assistant\s*/gi, '').trim();

    return { analysis: cleanAnalysis, fitPercentage };
}