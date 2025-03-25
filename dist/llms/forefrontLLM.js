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
exports.ForefrontLLM = void 0;
const axios_1 = __importDefault(require("axios"));
const runnables_1 = require("@langchain/core/runnables");
class ForefrontLLM extends runnables_1.Runnable {
    constructor(apiKey) {
        super();
        this.url = process.env.FORE_FRONT_BASE_URL;
        this.model = process.env.FORE_FRONT_MODEL;
        this.apiKey = apiKey;
    }
    get lc_namespace() {
        return ["forefront", "llm"];
    }
    invoke(input, config) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
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
            const axiosInstance = axios_1.default.create({ timeout: 30000 });
            let retries = 2;
            while (retries > 0) {
                try {
                    if (!this.url) {
                        throw new Error("FORE_FRONT_BASE_URL is not defined in environment variables");
                    }
                    const response = yield axiosInstance.post(this.url, requestBody, {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            "Content-Type": "application/json",
                        },
                    });
                    return (((_c = (_b = (_a = response.data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "No analysis returned");
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error) && error.code === "ECONNABORTED") {
                        retries--;
                        if (retries === 0) {
                            throw new Error("LLM request timed out after retries");
                        }
                        yield new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                    else {
                        throw error instanceof Error
                            ? error
                            : new Error("Unknown error in ForefrontLLM");
                    }
                }
            }
            throw new Error("Unexpected retry loop exit");
        });
    }
}
exports.ForefrontLLM = ForefrontLLM;
