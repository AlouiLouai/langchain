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
function sanitizeText(text) {
    return text.replace(/[\n\r\t\\]/g, ' ').replace(/\s+/g, ' ').trim();
}
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
            return sanitizeText(description || 'No description found');
        }
        catch (error) {
            console.warn('LinkedIn fetch failed, using default:', error);
            return 'Default job description';
        }
    });
}
// Calculate fit percentage based on skills, experience, and keywords
function calculateFitPercentage(cvText, jobDescription) {
    const cvLower = cvText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    // Extract skills (simple keyword matching)
    const skillsList = [
        'javascript', 'typescript', 'python', 'express', 'nest js', 'strapi', 'gatsby', 'next.js',
        'flask', 'react', 'redux', 'postgresql', 'mysql', 'mongodb', 'aws', 'docker', 'kubernetes',
        'graphql', 'ci/cd', 'node.js', 'prisma', 'typeorm', 'sequelize',
    ];
    const cvSkills = skillsList.filter(skill => cvLower.includes(skill));
    const jobSkills = skillsList.filter(skill => jobLower.includes(skill));
    const skillMatch = jobSkills.length > 0 ? (cvSkills.filter(skill => jobSkills.includes(skill)).length / jobSkills.length) * 100 : 0;
    // Extract experience (years)
    const experienceRegex = /(\d+)\s*(?:year|yrs?)/gi;
    const cvExperienceMatches = [...cvLower.matchAll(experienceRegex)];
    const jobExperienceMatches = [...jobLower.matchAll(experienceRegex)];
    const cvYears = cvExperienceMatches.reduce((sum, match) => sum + parseInt(match[1]), 0);
    const jobYears = jobExperienceMatches.reduce((sum, match) => sum + parseInt(match[1]), 0) || 1; // Default to 1 if no years specified
    const experienceMatch = Math.min((cvYears / jobYears) * 100, 100); // Cap at 100%
    // Keyword matching
    const jobKeywords = jobLower.split(' ').filter(word => word.length > 3); // Basic keyword extraction
    const keywordMatches = jobKeywords.filter(keyword => cvLower.includes(keyword)).length;
    const keywordMatch = (keywordMatches / jobKeywords.length) * 100;
    // Weighted average: skills (40%), experience (30%), keywords (30%)
    const fitPercentage = (0.4 * skillMatch) + (0.3 * experienceMatch) + (0.3 * keywordMatch);
    return Math.round(Math.min(fitPercentage, 100)); // Cap at 100%
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
                jobDescription = sanitizeText(req.body.jobDescription);
            }
            else {
                jobDescription = 'Default job description';
            }
            const analysis = yield (0, llmService_1.analyzeCVWithLLM)(pdfData.text, jobDescription);
            const fitPercentage = calculateFitPercentage(pdfData.text, jobDescription);
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
