import { Command } from "@langchain/langgraph";
import { GraphState } from "../state";
import { NODES } from "../nodes";
import { Renderer } from "../../renderer";

export const Action = async (state: GraphState) => {
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

  Renderer.actionEffect(state.lastAction);

  const newAdventure = structuredClone(state.currentAdventure);

  if (state.lastAction.roomDescription) {
    newAdventure.rooms[state.currentRoomKey].description =
      state.lastAction.roomDescription;
  }

  return new Command({
    update: {
      currentAdventure: newAdventure,
      actionHistory: state.lastAction.name,
      currentRoomKey: state.lastAction.next_room
        ? state.lastAction.next_room
        : state.currentRoomKey,
      ended: state.lastAction.end_game,
    },
    goto: NODES.PLAYER_INPUT,
  });
};
