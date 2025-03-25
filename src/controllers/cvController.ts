import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeCVWithLLM } from '../services/llmService';
import axios from 'axios';
import cheerio from 'cheerio';
import { sanitizeText } from '../utils/textSummerisation';

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
        return 'Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS';
    }
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
            jobDescription = 'Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS';
        }

        // Get analysis and fit percentage from LLM
        const { analysis, fitPercentage } = await analyzeCVWithLLM(pdfData.text, jobDescription);

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