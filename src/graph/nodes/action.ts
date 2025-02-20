import { Command } from "@langchain/langgraph";
import { GraphState } from "../state.js";
import { NODES } from "../nodes.js";
import { Renderer } from "../../renderer.js";
import { getRoom } from "../../utils.js";

export const Action = async (state: GraphState) => {
  const output = [];
  const requiredAction = state.lastAction.conditions?.requiredAction;

  if (
    requiredAction &&
    state.actionHistory.includes(requiredAction) === false
  ) {
    return new Command({
      update: {
        failedAction: state.lastAction.name,
      },
      goto: NODES.FAILURE,
    });
  }

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
