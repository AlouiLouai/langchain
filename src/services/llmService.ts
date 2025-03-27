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
        ["human", `
          You are an expert recruiter evaluating whether a candidate should apply for a job based on their CV and the job description. Provide a structured assessment:
      
          - **Overall Fit**: Clearly state if the candidate is a "Strong Match", "Moderate Match", or "Weak Match" for the job.
          - **Key Strengths**: Highlight the most relevant skills and experience aligning with the job.
          - **Gaps & Weaknesses**: Identify missing skills or experience that could be a challenge.
          - **Final Recommendation**: Answer decisively with "Yes, you should apply" or "No, you should not apply", followed by a brief explanation.
      
          CV Content:
          {cvText}
      
          Job Description:
          {jobDescription}
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