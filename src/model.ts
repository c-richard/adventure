import { ChatOllama } from "@langchain/ollama";

export const model = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0.1,
});
