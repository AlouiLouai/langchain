import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeCVWithLLM } from '../services/llmService';
import axios from 'axios';
import cheerio from 'cheerio';

function sanitizeText(text: string): string {
    return text.replace(/[\n\r\t\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchLinkedInJobDescription(jobUrl: string): Promise<string> {
    try {
        const response = await axios.get(jobUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 10000,
        });
        const $ = cheerio.load(response.data);
        const description = $('.description__text').text().replace(/See more|See less/g, '');
        return sanitizeText(description || 'No description found');
    } catch (error) {
        console.warn('LinkedIn fetch failed, using default:', error);
        return 'Default job description';
    }
}

// Calculate fit percentage based on skills, experience, and keywords
function calculateFitPercentage(cvText: string, jobDescription: string): number {
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

export async function uploadAndAnalyzeCV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded. Use field name "cv"' });
            return;
        }

        const pdfData = await extractTextFromPDF(req.file.path);
        let jobDescription: string;
        if (req.body.linkedinJobUrl) {
            jobDescription = await fetchLinkedInJobDescription(req.body.linkedinJobUrl);
        } else if (req.body.jobDescription) {
            jobDescription = sanitizeText(req.body.jobDescription);
        } else {
            jobDescription = 'Default job description';
        }

        const analysis = await analyzeCVWithLLM(pdfData.text, jobDescription);
        const fitPercentage = calculateFitPercentage(pdfData.text, jobDescription);

        res.json({ analysis, fitPercentage });
    } catch (error) {
        console.error('Error in CV processing:', error);
        if (error instanceof MulterError) {
            res.status(400).json({ error: error.message });
        } else if (error instanceof Error) {
            res.status(500).json({ error: 'Processing failed', details: error.message });
        } else {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
}