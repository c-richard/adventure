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

  if (state.lastAction.roomDescription) {
    newAdventure.rooms[state.currentRoomKey].description =
      state.lastAction.roomDescription;
  }

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
