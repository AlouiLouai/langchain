"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeText = summarizeText;
exports.sanitizeText = sanitizeText;
function summarizeText(text, maxLength = 1000) {
    const sentences = text.split("\n").filter((line) => line.trim());
    let summary = "";
    for (const sentence of sentences) {
        if (summary.length + sentence.length <= maxLength) {
            summary += sentence + " ";
        }
        else {
            break;
        }
    }
    return summary.trim() || text.substring(0, maxLength);
}
function sanitizeText(text) {
    return text
        .replace(/[\n\r\t\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
