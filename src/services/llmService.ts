import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ForefrontLLM } from '../llms/forefrontLLM';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Predefine the prompt template (static, reusable)
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "human",
    `
      You are an expert recruiter evaluating a candidate's fit for a job based on their CV and the job description. Provide a structured assessment in this exact format:

      **Overall Fit**: [Strong Match|Moderate Match|Weak Match]
      **Key Strengths**: [List relevant skills/experience, e.g., "TypeScript expertise, 3+ years in AWS"]
      **Gaps & Weaknesses**: [List missing skills/experience, e.g., "No cloud experience"]
      **Final Recommendation**: [Yes, you should apply|No, you should not apply] - [Brief explanation]
      **Fit Score**: [Number between 0-100]

      CV Content:
      {cvText}

      Job Description:
      {jobDescription}
    `,
  ],
]);

// Predefine the chain outside the function (singleton-like)
const createChain = (llm: ForefrontLLM) => {
  return RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);
};

// Simple, efficient parser for structured output
function parseAnalysis(rawAnalysis: string): { analysis: string; fitPercentage: number } {
  const lines = rawAnalysis.split('\n').map(line => line.trim());
  let fitPercentage = 50; // Default fallback
  let cleanAnalysis = '';

  for (const line of lines) {
    if (line.startsWith('**Fit Score**:')) {
      const scoreMatch = line.match(/\d+/);
      fitPercentage = scoreMatch ? Math.min(parseInt(scoreMatch[0], 10), 100) : 50;
    } else {
      cleanAnalysis += (cleanAnalysis ? '\n' : '') + line; // Build output efficiently
    }
  }

  // Remove unwanted markers in one pass
  cleanAnalysis = cleanAnalysis.replace(/<\|im_end\|>|<\|im_start\|>|\s*assistant\s*/gi, '').trim();

  return { analysis: cleanAnalysis || 'Analysis unavailable', fitPercentage };
}

export async function analyzeCVWithLLM(cvText: string, jobDescription: string): Promise<{ analysis: string; fitPercentage: number }> {
  const apiKey = process.env.FORE_FRONT_API_KEY;
  if (!apiKey) {
    throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
  }

  // Initialize LLM once (could be cached globally in a real app)
  const llm = new ForefrontLLM(apiKey);
  const chain = createChain(llm);

  try {
    // Truncate inputs to avoid overwhelming the LLM
    const maxLength = 10000;
    const truncatedCV = cvText.slice(0, maxLength);
    const truncatedJobDesc = jobDescription.slice(0, maxLength);

    // Execute the chain
    const rawAnalysis = await chain.invoke({ cvText: truncatedCV, jobDescription: truncatedJobDesc });

    // Parse the response efficiently
    return parseAnalysis(rawAnalysis);
  } catch (error) {
    console.error('Error analyzing CV with LLM:', error);
    // Fallback response for reliability
    return {
      analysis: 'Unable to analyze CV due to processing error.',
      fitPercentage: 0,
    };
  }
}