"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCVWithLLM = analyzeCVWithLLM;
const prompts_1 = require("@langchain/core/prompts");
const forefrontLLM_1 = require("../llms/forefrontLLM");
const output_parsers_1 = require("@langchain/core/output_parsers");
function analyzeCVWithLLM(cvText, jobDescription) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.FORE_FRONT_API_KEY;
        if (!apiKey) {
            throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
        }
        const llm = new forefrontLLM_1.ForefrontLLM(apiKey);
        // Define the prompt as a message array
        const promptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
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
        const chain = promptTemplate.pipe(llm).pipe(new output_parsers_1.StringOutputParser());
        // Execute the chain
        const rawAnalysis = yield chain.invoke({ cvText, jobDescription });
        // Parse the response to extract fit percentage
        const fitMatch = rawAnalysis.match(/Fit Score.*?(\d+)/i);
        const fitPercentage = fitMatch ? Math.min(parseInt(fitMatch[1]), 100) : 50; // Default to 50 if not found
        // Clean the analysis of any unwanted markers
        const cleanAnalysis = rawAnalysis.replace(/<\|im_end\|>|<\|im_start\|>|\s*assistant\s*/gi, '').trim();
        return { analysis: cleanAnalysis, fitPercentage };
    });
}
