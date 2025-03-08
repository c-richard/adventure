import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../state.js";
import { getRoom } from "../../utils.js";
import { model } from "../../model.js";

const promptTemplate = PromptTemplate.fromTemplate(
  `
    You are a text adventure game responding to a player command.
    The player is currently in the {roomTitle} room described as: {roomDescription}.
    The player just entered the command: '{failedAction}'.

    If the command is possible, provide a brief, one-sentence response to the outcome.
    If the command isn't possible or doesn't make sense, provide a brief, one-sentence response explaining why, clearly indicating that the action cannot be taken.

    The response should role-play the player's attempt at the action but must strictly adhere to these rules:
      - The response must be concise and simple (no more than one sentence).
      - If the action is impossible, clearly state why without implying any change in the game world.
      - The response cannot introduce new elements not present in the room description.
      - The response cannot change the room, story, player's location, or position.
  `
);

export const Failure = async (state: GraphState) => {
  const failedAction = state.failedAction;

  const currentRoom = getRoom(state.currentAdventure, state.currentRoomKey);

  const prompt = await promptTemplate.invoke({
    roomTitle: currentRoom.title,
    roomDescription: currentRoom.description,
    failedAction,
  });

  return {
    output: [(await model.invoke(prompt)).content],
  };
};
