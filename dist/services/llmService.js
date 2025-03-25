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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCVWithLLM = analyzeCVWithLLM;
const axios_1 = __importDefault(require("axios"));
const textSummerisation_1 = require("../utils/textSummerisation");
function analyzeCVWithLLM(cvText, jobDescription) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const apiKey = process.env.FORE_FRONT_API_KEY;
        if (!apiKey) {
            throw new Error('FORE_FRONT_API_KEY is missing in environment variables');
        }
        const summarizedCV = (0, textSummerisation_1.summarizeText)(cvText, 1000);
        const prompt = `
        Provide a structured qualitative assessment of how well the following CV matches this job description. Use this format:
        - **Summary**: Overall fit assessment (e.g., "Strong match", "Fairly good").
        - **Skills**: List relevant skills from the CV that match the job description.
        - **Experience**: Describe how the candidate's experience aligns with the job requirements.
        CV Content: ${summarizedCV}
        Job Description: ${jobDescription}
    `;
        const model = process.env.FORE_FRONT_MODEL;
        const url = process.env.FORE_FRONT_BASE_URl;
        const requestBody = {
            messages: [{ role: 'user', content: prompt }],
            model: model,
            max_tokens: 300, // Further reduced for speed
            temperature: 0.7,
        };
        const axiosInstance = axios_1.default.create({ timeout: 30000 });
        let retries = 2;
        while (retries > 0) {
            try {
                if (url) {
                    const response = yield axiosInstance.post(url, requestBody, {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    return ((_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || 'No analysis returned';
                }
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error) && error.code === 'ECONNABORTED') {
                    retries--;
                    if (retries === 0) {
                        throw new Error('LLM analysis failed: Request timed out after retries');
                    }
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
                else if (axios_1.default.isAxiosError(error)) {
                    throw new Error(`LLM analysis failed: ${((_f = (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.message) || error.message}`);
                }
                else {
                    throw new Error(`LLM analysis failed: ${error.message}`);
                }
            }
        }
        throw new Error('LLM analysis failed: Unexpected retry loop exit');
    });
}
