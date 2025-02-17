import { GraphState } from "../state";
import { PromptTemplate } from "@langchain/core/prompts";
import { getRoom } from "../../utils";
import { model } from "../../model";

const promptTemplate = PromptTemplate.fromTemplate(
  `
    You are in a text adventure game.
    The player is currently in the {roomTitle} room described as: {roomDescription}.
    The player just entered the command: '{failedAction}'.

    If the command is possible, provide a brief, one-sentence response to the outcome.
    If the command isn't possible or doesn't make sense, briefly explain why in one sentence, either with a short reason or description of why it's impractical.

    Responses should be concise, no more than one sentence, and should not impact the story, the room or the players location
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

  await model.invoke(prompt);
};
