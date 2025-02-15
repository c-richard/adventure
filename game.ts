import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { z } from "zod";
import { tool } from "@langchain/core/tools";

const moveSchema = z.object({
  direction: z
    .enum(["west", "east", "south", "north"])
    .describe("The direction to move the player"),
});

const moveTool = tool(
  async ({ direction }) => {
    return `Player has moved ${direction}`;
  },
  {
    name: "player mover",
    description: "Can move a player as the result of an action",
    schema: moveSchema,
  }
);

const responseStructure = z.object({
  roomName: z.string().describe("The name of the current room"),
  description: z.string().describe("A concise description of the current room"),
  objects: z
    .array(z.string())
    .describe("A short list of important objects in the room"),
});

// Initialize Ollama with Mistral
const model = new ChatOllama({
  model: "mistral:7b",
  baseUrl: "http://localhost:11434",
}).withStructuredOutput(responseStructure, { name: "Response structure" });

const start = async () => {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", "Describe a response to the users actionn"],
    ["user", "{action}"],
  ]);

  const promptValue = await promptTemplate.invoke({
    action: "look around",
  });

  const response = await model.invoke(promptValue);

  console.log(response);
};

start();
