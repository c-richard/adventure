import { Command } from "@langchain/langgraph";
import { GraphState } from "../graphState";
import { Renderer } from "../renderer";
import { getRoom } from "../utils";
import { Adventure } from "../types";

export const Action = (adventure: Adventure) => async (state: GraphState) => {
  const requiredAction = state.lastAction.conditions?.requiredAction;

  if (
    requiredAction &&
    state.actionHistory.includes(requiredAction) === false
  ) {
    return new Command({
      update: {
        failedAction: state.lastAction.name,
      },
      goto: "inputFailure",
    });
  }

  Renderer.actionEffect(state.lastAction);

  return new Command({
    update: {
      actionHistory: state.lastAction.name,
      currentRoom: state.lastAction.next_room
        ? getRoom(adventure, state.lastAction.next_room)
        : state.currentRoom,
      ended: state.lastAction.end_game,
    },
    goto: "playerInput",
  });
};
