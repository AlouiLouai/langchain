import axios, { AxiosInstance, AxiosError } from "axios";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { ChatPromptValueLike } from "../types";

// Utility to implement exponential backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ForefrontLLM extends Runnable<ChatPromptValueLike, string> {
  private apiKey: string;
  private url: string;
  private model: string;
  private axiosInstance: AxiosInstance;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
    this.url = process.env.FORE_FRONT_BASE_URL || "";
    this.model = process.env.FORE_FRONT_MODEL || "default-model"; // Fallback model

    // Validate env vars early
    if (!this.url) {
      throw new Error("FORE_FRONT_BASE_URL must be defined in environment variables");
    }

    // Pre-configure Axios with optimal settings
    this.axiosInstance = axios.create({
      timeout: 20000, // Reduced to 20s to fail fast; adjust as needed
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      // Optimize HTTP keep-alive for performance
      httpAgent: new (require("http").Agent)({ keepAlive: true }),
      httpsAgent: new (require("https").Agent)({ keepAlive: true }),
    });
  }

  get lc_namespace(): string[] {
    return ["forefront", "llm"];
  }

  async invoke(input: ChatPromptValueLike, config?: RunnableConfig): Promise<string> {
    // Preprocess prompt efficiently
    const prompt = this.extractPrompt(input);
    if (!prompt) {
      throw new Error("No valid human prompt found in input messages");
    }

    const requestBody = {
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      max_tokens: 200, // Kept low for faster responses
      temperature: 0.7,
    };

    return this.callApiWithRetry(requestBody);
  }

  // Extract prompt with minimal overhead
  private extractPrompt(input: ChatPromptValueLike): string {
    const humanMessages = input.messages.filter((msg) => msg._getType() === "human");
    if (!humanMessages.length) return "";
    return humanMessages
      .map((msg) => msg.content)
      .join("\n")
      .slice(0, 10000); // Cap at 10k chars
  }

  // Retry logic with exponential backoff
  private async callApiWithRetry(requestBody: any, maxRetries = 2): Promise<string> {
    let attempt = 0;
    const baseDelay = 500; // Start with 0.5s delay

    while (attempt <= maxRetries) {
      try {
        const response = await this.axiosInstance.post(this.url, requestBody);
        return response.data.choices?.[0]?.message?.content || "No analysis returned";
      } catch (error) {
        const axiosError = error as AxiosError;
        attempt++;

        if (axiosError.code === "ECONNABORTED" || axiosError.response?.status === 429) {
          if (attempt > maxRetries) {
            throw new Error(`LLM request failed after ${maxRetries + 1} attempts: Timeout or rate limit`);
          }
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await sleep(delay);
        } else {
          // Non-retryable errors (e.g., 400, 401, 500)
          throw axiosError.response
            ? new Error(`API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`)
            : axiosError;
        }
      }
    }
    throw new Error("Unexpected retry loop exit");
  }
}