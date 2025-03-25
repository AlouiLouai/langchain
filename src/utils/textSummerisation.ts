export function summarizeText(text: string, maxLength: number = 1000): string {
  const sentences = text.split("\n").filter((line) => line.trim());
  let summary = "";
  for (const sentence of sentences) {
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence + " ";
    } else {
      break;
    }
  }
  return summary.trim() || text.substring(0, maxLength);
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[\n\r\t\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
