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
exports.uploadAndAnalyzeCV = uploadAndAnalyzeCV;
const multer_1 = require("multer");
const pdfService_1 = require("../services/pdfService");
const llmService_1 = require("../services/llmService");
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const textSummerisation_1 = require("../utils/textSummerisation");
function fetchLinkedInJobDescription(jobUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(jobUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                timeout: 10000,
            });
            const $ = cheerio_1.default.load(response.data);
            const description = $('.description__text').text().replace(/See more|See less/g, '');
            return (0, textSummerisation_1.sanitizeText)(description || 'No description found');
        }
        catch (error) {
            console.warn('LinkedIn fetch failed, using default:', error);
            return 'Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS';
        }
    });
}
function uploadAndAnalyzeCV(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded. Use field name "cv"' });
                return;
            }
            const pdfData = yield (0, pdfService_1.extractTextFromPDF)(req.file.path);
            let jobDescription;
            if (req.body.linkedinJobUrl) {
                jobDescription = yield fetchLinkedInJobDescription(req.body.linkedinJobUrl);
            }
            else if (req.body.jobDescription) {
                jobDescription = (0, textSummerisation_1.sanitizeText)(req.body.jobDescription);
            }
            else {
                jobDescription = 'Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS';
            }
            // Get analysis and fit percentage from LLM
            const { analysis, fitPercentage } = yield (0, llmService_1.analyzeCVWithLLM)(pdfData.text, jobDescription);
            res.json({ analysis, fitPercentage });
        }
        catch (error) {
            console.error('Error in CV processing:', error);
            if (error instanceof multer_1.MulterError) {
                res.status(400).json({ error: error.message });
            }
            else if (error instanceof Error) {
                res.status(500).json({ error: 'Processing failed', details: error.message });
            }
            else {
                res.status(500).json({ error: 'Unknown error' });
            }
        }
    });
}
