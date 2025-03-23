import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { MulterError } from 'multer';

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

const app = express();
const port = 3000;

app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript Express!');
});

// PDF upload and processing endpoint
app.post('/api/upload-cv', 
    upload.single('cv'), 
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            // Read the uploaded PDF file
            const pdfBuffer = require('fs').readFileSync(req.file.path);
            
            // Extract text from PDF
            const data = await pdfParse(pdfBuffer);
            
            // Clean up: delete the temporary file
            require('fs').unlinkSync(req.file.path);

            // Send the extracted text
            res.json({
                text: data.text,
                pageCount: data.numpages,
                info: data.info
            });
        } catch (error) {
            console.error('Error processing PDF:', error);
            if (error instanceof MulterError) {
                res.status(400).json({ error: error.message });
            } else if (error instanceof Error) {
                res.status(500).json({ error: 'Error processing PDF', details: error.message });
            } else {
                res.status(500).json({ error: 'Unknown error occurred' });
            }
        }
    }
);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});