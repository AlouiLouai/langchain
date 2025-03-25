import { BaseMessage } from "@langchain/core/messages";

export interface PDFExtractResult {
  text: string;
  pageCount: number;
  info: any;
}

// Define a minimal interface for ChatPromptValue since it’s not exported
export interface ChatPromptValueLike {
  messages: BaseMessage[];
}
