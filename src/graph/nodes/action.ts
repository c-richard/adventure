import { Command } from "@langchain/langgraph";
import { GraphState } from "../state.js";
import { NODES } from "../nodes.js";
import { Renderer } from "../../renderer.js";
import { getRoom } from "../../utils.js";
import { PromptTemplate } from "@langchain/core/prompts";
import z from "zod";
import { model } from "../../model.js";

const promptTemplate = PromptTemplate.fromTemplate(
  `
  The player is attempting to perform the action: "{actionName}".

  However, this action requires the following condition(s) to be met: "{conditions}".
  Player History:

      Previous Actions Taken:
      {actionHistory}

  Based on the player's history, determine if they meet the necessary conditions.

  Return true if the player can take the action, otherwise return false.
`
);

const descriptionUpdatePromptTemplate = PromptTemplate.fromTemplate(
  `  
  The current room description is:
  {currentRoomDescription}

  The player is attempting to perform the action: "{actionName}".

  The action has the effect: {actionEffect}

  Write a new room description for the current room after the action has been taken.

  The new description must be similar to the old one so players dont get confused.

  It must describe what the room looks like after looking at it.

  If the action taken is minimal just return the original description.

  Only add to the description if the action has a visible effect on the room.

  Just return the room description
`
);

const successStructuredOutput = z.object({
  success: z
    .enum(["true", "false"])
    .describe("Whether the action was successful"),
});

export const Action = async (state: GraphState) => {
  if (state.lastAction.condition !== undefined) {
    const prompt = await promptTemplate.invoke({
      actionName: state.lastAction.name,
      conditions: state.lastAction.condition,
      actionHistory: state.actionHistory,
    });

    const response = await model
      .withStructuredOutput(successStructuredOutput)
      .invoke(prompt);

    if (response.success === "false") {
      return new Command({
        update: {
          failedAction: state.lastAction.name,
        },
        goto: NODES.FAILURE,
      });
    }
  }

  const output = [];
  output.push(Renderer.actionEffect(state.lastAction));

  const newAdventure = structuredClone(state.currentAdventure);

  const prompt = await descriptionUpdatePromptTemplate.invoke({
    currentRoomDescription:
      newAdventure.rooms[state.currentRoomKey].description,
    actionName: state.lastAction.name,
    actionEffect: state.lastAction.result,
  });

  const response = await model.invoke(prompt);

  newAdventure.rooms[state.currentRoomKey].description =
    response.content.toString();

  if (state.lastAction.next_room) {
    output.push(
      Renderer.room(getRoom(state.currentAdventure, state.lastAction.next_room))
    );
  }

  return new Command({
    update: {
      currentAdventure: newAdventure,
      actionHistory: state.lastAction.name,
      currentRoomKey: state.lastAction.next_room
        ? state.lastAction.next_room
        : state.currentRoomKey,
      ended: state.lastAction.end_game,
      output,
    },
    goto: NODES.PLAYER_INPUT,
  });
};
