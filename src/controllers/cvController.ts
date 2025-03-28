import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeCVWithLLM } from '../services/llmService';
import axios, { AxiosError } from 'axios';
import cheerio from 'cheerio';
import { sanitizeText } from '../utils/textSummerisation';
import fs from 'fs/promises'; // For file cleanup

// Optimized LinkedIn fetch with better error handling
async function fetchLinkedInJobDescription(jobUrl: string): Promise<string> {
  try {
    if (!jobUrl || !jobUrl.startsWith('https://www.linkedin.com')) {
      throw new Error('Invalid LinkedIn job URL');
    }

    const response = await axios.get(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 15000, // 15s timeout
      maxRedirects: 5, // Handle redirects
    });

    const $ = cheerio.load(response.data);
    const description = $('.description__text').text().replace(/See more|See less/g, '');
    return sanitizeText(description || 'No description found');
  } catch (error) {
    const errMsg = error instanceof AxiosError 
      ? `LinkedIn fetch failed: ${error.code || error.message}`
      : `LinkedIn fetch failed: ${String(error)}`;
    console.warn(errMsg);
    return 'Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS'; // Inline default
  }
}

// Type-safe request body
interface AnalyzeCVRequestBody {
  linkedinJobUrl?: string;
  jobDescription?: string;
}

export async function uploadAndAnalyzeCV(req: Request<{}, {}, AnalyzeCVRequestBody>, res: Response, next: NextFunction): Promise<void> {
  let filePath: string | undefined; // For cleanup

  try {
    // Validate file upload
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Use field name "cv"' });
      return;
    }
    filePath = req.file.path;

    // Parallelize PDF extraction and LinkedIn fetch
    const { linkedinJobUrl, jobDescription: rawJobDesc } = req.body;
    const [pdfData, jobDescription] = await Promise.all([
      extractTextFromPDF(filePath).then(data => {
        if (!data.text || data.text.trim().length === 0) {
          throw new Error('Empty or invalid PDF content');
        }
        return data;
      }),
      linkedinJobUrl
        ? fetchLinkedInJobDescription(linkedinJobUrl)
        : rawJobDesc
          ? Promise.resolve(sanitizeText(rawJobDesc)).then(text => {
              if (!text || text.length < 10) {
                throw new Error('Job description too short or invalid');
              }
              return text;
            })
          : Promise.resolve('Software Engineer with 3+ years experience in JavaScript, TypeScript, and AWS'),
    ]);

    // Analyze with LLM
    const { analysis, fitPercentage } = await analyzeCVWithLLM(pdfData.text, jobDescription);

    // Success response
    res.status(200).json({ analysis, fitPercentage });
  } catch (error) {
    // Enhanced error handling
    console.error('Error in uploadAndAnalyzeCV:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      fileSize: req.file?.size,
      linkedinJobUrl: req.body.linkedinJobUrl,
    });

    if (error instanceof MulterError) {
      res.status(400).json({ error: 'File upload error', details: error.message });
    } else if (error instanceof AxiosError) {
      res.status(502).json({ error: 'Failed to fetch job description', details: error.message });
    } else if (error instanceof Error) {
      res.status(500).json({ error: 'Processing failed', details: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  } finally {
    // Cleanup uploaded file
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('Failed to delete temp file:', cleanupError);
      }
    }
  }
}