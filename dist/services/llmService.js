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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function summarizeText(text, maxLength = 1000) {
    const sentences = text.split('\n').filter(line => line.trim());
    let summary = '';
    for (const sentence of sentences) {
        if (summary.length + sentence.length <= maxLength) {
            summary += sentence + ' ';
        }
        else {
            break;
        }
    }
    return summary.trim() || text.substring(0, maxLength);
}
function analyzeCVWithLLM(cvText, jobDescription) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
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
        const axiosInstance = axios_1.default.create({ timeout: 30000 });
        let retries = 2;
        while (retries > 0) {
            try {
                const response = yield axiosInstance.post(url, requestBody, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                return ((_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || 'No analysis returned';
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
