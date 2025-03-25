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
exports.extractTextFromPDF = extractTextFromPDF;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const fs_1 = require("fs");
function extractTextFromPDF(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pdfBuffer = (0, fs_1.readFileSync)(filePath);
            const data = yield (0, pdf_parse_1.default)(pdfBuffer);
            (0, fs_1.unlinkSync)(filePath);
            return {
                text: data.text,
                pageCount: data.numpages,
                info: data.info,
            };
        }
        catch (error) {
            throw new Error(`PDF extraction failed: ${error.message}`);
        }
    });
}
