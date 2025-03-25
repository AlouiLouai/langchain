import axios from "axios";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { ChatPromptValueLike } from "../types";

export class ForefrontLLM extends Runnable<ChatPromptValueLike, string> {
  private apiKey: string;
  private url: string | undefined = process.env.FORE_FRONT_BASE_URL;
  private model: string | undefined = process.env.FORE_FRONT_MODEL;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  get lc_namespace(): string[] {
    return ["forefront", "llm"];
  }

  async invoke(
    input: ChatPromptValueLike,
    config?: RunnableConfig
  ): Promise<string> {
    // Extract the prompt string from ChatPromptValueLike
    const prompt = input.messages
      .filter((msg) => msg._getType() === "human")
      .map((msg) => msg.content)
      .join("\n");

    if (!prompt) {
      throw new Error("No user prompt found in input messages");
    }

    const requestBody = {
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      max_tokens: 500,
      temperature: 0.7,
    };

    const axiosInstance = axios.create({ timeout: 30000 });
    let retries = 2;

    while (retries > 0) {
      try {
        if (!this.url) {
          throw new Error(
            "FORE_FRONT_BASE_URL is not defined in environment variables"
          );
        }
        const response = await axiosInstance.post(this.url, requestBody, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        });
        return (
          response.data.choices?.[0]?.message?.content || "No analysis returned"
        );
      } catch (error) {
        if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
          retries--;
          if (retries === 0) {
            throw new Error("LLM request timed out after retries");
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          throw error instanceof Error
            ? error
            : new Error("Unknown error in ForefrontLLM");
        }
      }
    }
    throw new Error("Unexpected retry loop exit");
  }
}
