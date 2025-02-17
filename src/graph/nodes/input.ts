import {
  interrupt,
  Command,
  Annotation,
  StateGraph,
} from "@langchain/langgraph";
import { NODES } from "../nodes";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { getRoom } from "../../utils";
import { Adventure } from "../../types";
import { model } from "../../model";

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

const InputStateAnnotation = Annotation.Root({
  classifiedInput: Annotation<string>,
  currentAdventure: Annotation<Adventure>,
  currentRoomKey: Annotation<string>,
});

const InputClassifier = async (state: typeof InputStateAnnotation.State) => {
  const playerInput = (interrupt("player_input") as string).toLowerCase();

  if (playerInput === "quit") {
    return {
      classifiedInput: "quit",
    };
  }

  const currentRoom = getRoom(state.currentAdventure, state.currentRoomKey);

  const option = z.object({
    action: z.enum([
      "look",
      ...currentRoom.actions.map((a) => a.name),
      "unknown",
    ]),
  });

  const prompt = await promptTemplate.invoke({
    roomTitle: currentRoom.title,
    roomDescription: currentRoom.description,
    playerInput,
    possibleActions: currentRoom.actions
      .map(
        (a) =>
          `"${a.name}": Alternatives include ${a.alternativeNames
            .map((a) => `"${a}"`)
            .join(", ")} etc.`
      )
      .join("\n"),
  });

  const response = await model.withStructuredOutput(option).invoke(prompt);

  return {
    classifiedInput: response.action,
  };
};

const CommandRouter = async (state: typeof InputStateAnnotation.State) => {
  const playerInput = state.classifiedInput;
  const currentRoom = getRoom(state.currentAdventure, state.currentRoomKey);

  if (playerInput === "quit") {
    return new Command({
      update: {
        ended: "ended",
      },
      goto: NODES.END,
      graph: Command.PARENT,
    });
  }

  if (playerInput === "look") {
    return new Command({
      goto: NODES.LOOK,
      graph: Command.PARENT,
    });
  }

  const action = currentRoom.actions.find((op) => op.name === playerInput);

  if (action !== undefined) {
    return new Command({
      update: {
        lastAction: action,
      },
      goto: NODES.ACTION,
      graph: Command.PARENT,
    });
  }

  return new Command({
    update: {
      failedAction: playerInput,
    },
    goto: NODES.FAILURE,
    graph: Command.PARENT,
  });
};

export const InputGraph = new StateGraph(InputStateAnnotation)
  .addNode("input_classifier", InputClassifier)
  .addNode("command_router", CommandRouter)
  .addEdge("__start__", "input_classifier")
  .addEdge("input_classifier", "command_router")
  .addEdge("command_router", "__end__")
  .compile();
