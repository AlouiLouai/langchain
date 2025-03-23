import pdfParse from 'pdf-parse';
import { readFileSync, unlinkSync } from 'fs';
import { PDFExtractResult } from '../types';

export async function extractTextFromPDF(filePath: string): Promise<PDFExtractResult> {
    try {
        const pdfBuffer = readFileSync(filePath);
        const data = await pdfParse(pdfBuffer);
        unlinkSync(filePath); // Clean up
        return {
            text: data.text,
            pageCount: data.numpages,
            info: data.info,
        };
    } catch (error) {
        throw new Error(`PDF extraction failed: ${(error as Error).message}`);
    }
}