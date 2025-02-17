import { interrupt, Command } from "@langchain/langgraph";
import { GraphState } from "../state";
import { NODES } from "../nodes";
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const model = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0.1,
});

const promptTemplate = PromptTemplate.fromTemplate(
  `
The player is in a room titled "{roomTitle}", which is described as: "{roomDescription}". The player has provided the input: "{playerInput}"

Your task is to categorize the player's input into one of the following actions:

    "look": Alternatives include "survey", "view", "inspect", "glance", "peruse", etc.
    {possibleActions}
    unknown: When the player's input is unclear or does not match any predefined action.

Return a structured response with the key "action", where the value is one of the actions listed above. If the input doesn't match any of the predefined actions, return "unknown".
  `
);

export const Input = async (state: GraphState) => {
  const playerInput = (interrupt("player_input") as string).toLowerCase();

  if (playerInput === "quit") {
    return new Command({
      update: {
        ended: "ended",
      },
      goto: NODES.END,
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
    roomTitle: state.currentRoom.title,
    roomDescription: state.currentRoom.description,
    playerInput,
    possibleActions: state.currentRoom.actions
      .map(
        (a) =>
          `"${a.name}": Alternatives include ${a.alternativeNames
            .map((a) => `"${a}"`)
            .join(", ")} etc.`
      )
      .join("\n"),
  });

  const response = await model.withStructuredOutput(option).invoke(prompt);

  const transformedInput = response.action;

  if (transformedInput === "look") {
    return new Command({
      goto: NODES.LOOK,
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
      goto: NODES.ACTION,
    });
  }

  return new Command({
    update: {
      failedAction: playerInput,
    },
    goto: NODES.FAILURE,
  });
};
