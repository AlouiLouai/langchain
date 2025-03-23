import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeCVWithLLM } from '../services/llmService';
import axios from 'axios'; // For fetching LinkedIn job description
import cheerio from 'cheerio'; // For parsing HTML content

// Utility function to clean and sanitize text
function sanitizeText(text: string): string {
    // Replace control characters and trim
    return text
        .replace(/[\n\r\t\\]/g, ' ') // Replace newlines, tabs, etc., with spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces into one
        .trim(); // Remove leading/trailing whitespace
}

// Fetch job description from LinkedIn (basic scraping example)
async function fetchLinkedInJobDescription(jobUrl: string): Promise<string> {
    try {
        const response = await axios.get(jobUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });
        const $ = cheerio.load(response.data);
        // Adjust this selector based on LinkedIn's current HTML structure
        const description = $('.description__text') // Common class for job description
            .text()
            .replace(/See more|See less/g, ''); // Remove UI text
        return sanitizeText(description || 'No description found');
    } catch (error) {
        throw new Error(`Failed to fetch LinkedIn job description: ${(error as Error).message}`);
    }
}

export async function uploadAndAnalyzeCV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded. Use field name "cv"' });
            return;
        }

        const pdfData = await extractTextFromPDF(req.file.path);

        // Get job description: prioritize LinkedIn URL if provided, fallback to body text or default
        let jobDescription: string;
        if (req.body.linkedinJobUrl) {
            jobDescription = await fetchLinkedInJobDescription(req.body.linkedinJobUrl);
        } else if (req.body.jobDescription) {
            jobDescription = sanitizeText(req.body.jobDescription);
        } else {
            jobDescription = 'Default job description';
        }

        const analysis = await analyzeCVWithLLM(pdfData.text, jobDescription);

        res.json({
            cvContent: pdfData.text,
            pageCount: pdfData.pageCount,
            info: pdfData.info,
            jobDescription: jobDescription, // Include for reference
            analysis: analysis,
        });
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