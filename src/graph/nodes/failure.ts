import { GraphState } from "../state";
import { PromptTemplate } from "@langchain/core/prompts";
import { getRoom } from "../../utils";
import { model } from "../../model";

const promptTemplate = PromptTemplate.fromTemplate(
  `
    You are a text adventure game responding to a player command.
    The player is currently in the {roomTitle} room described as: {roomDescription}.
    The player just entered the command: '{failedAction}'.

    If the command is possible, provide a brief, one-sentence response to the outcome.
    If the command isn't possible or doesn't make sense, briefly explain why in one sentence, either with a short reason or description of why it's impractical.

    The response should role play the player taking that action.

    However, the response must be concise, no more than a single sentance, have no impact on the room, or the story or the players location.
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
