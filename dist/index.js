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
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const multer_2 = require("multer");
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
// Basic route
app.get('/', (req, res) => {
    res.send('Hello, TypeScript Express!');
});
// PDF upload and processing endpoint
app.post('/api/upload-cv', upload.single('cv'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Read the uploaded PDF file
        const pdfBuffer = require('fs').readFileSync(req.file.path);
        // Extract text from PDF
        const data = yield (0, pdf_parse_1.default)(pdfBuffer);
        // Clean up: delete the temporary file
        require('fs').unlinkSync(req.file.path);
        // Send the extracted text
        res.json({
            text: data.text,
            pageCount: data.numpages,
            info: data.info
        });
    }
    catch (error) {
        console.error('Error processing PDF:', error);
        if (error instanceof multer_2.MulterError) {
            res.status(400).json({ error: error.message });
        }
        else if (error instanceof Error) {
            res.status(500).json({ error: 'Error processing PDF', details: error.message });
        }
        else {
            res.status(500).json({ error: 'Unknown error occurred' });
        }
    }
}));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
