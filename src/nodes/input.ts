import { interrupt, Command } from "@langchain/langgraph";
import { GraphState } from "../graphState";
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const model = new ChatOllama({
  model: "llama3.2:3b",
});

const promptTemplate = PromptTemplate.fromTemplate(
  `
    You are a game command classifier. Based on the player's input, categorize it into one of the following actions:

    look, {possibleActions}, unknown

    Return a structured output with the key action, where the value is one of the actions listed above. If the player's input is unclear or does not match a predefined action, return "unknown".

    Now, process the following player input:

    Player input: {playerInput}
    `
);

export const Input = async (state: GraphState) => {
  const playerInput = interrupt("player_input");

  if (playerInput === "quit") {
    return new Command({
      update: {
        ended: "ended",
      },
      goto: "__end__",
    });
  }

  const option = z.object({
    action: z.enum([
      "look",
      ...state.currentRoom.actions.map((a) => a.name),
      "unknown",
    ]),
  });

  const prompt = await promptTemplate.invoke({
    playerInput,
    possibleActions: state.currentRoom.actions
      .map((a) => `${a.name}`)
      .join(", "),
  });

  const response = await model.withStructuredOutput(option).invoke(prompt);

  const transformedInput = response.action;

  if (transformedInput === "look") {
    return new Command({
      goto: "look",
    });
  }

  const action = state.currentRoom.actions.find(
    (op) => op.name === transformedInput
  );

  if (action !== undefined) {
    return new Command({
      update: {
        lastAction: action,
      },
      goto: "action",
    });
  }

  return new Command({
    goto: "inputFailure",
  });
};
