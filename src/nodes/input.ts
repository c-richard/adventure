import { interrupt, Command } from "@langchain/langgraph";
import { GraphState } from "../graphState";

export const Input = async (state: GraphState) => {
  const playerInput = interrupt("player_input");

  if (playerInput === "quit") {
    return new Command({
      update: {
        ended: "ended",
      },
      goto: "__end__",
    });
  }

  if (playerInput === "look") {
    return new Command({
      goto: "look",
    });
  }

  const action = state.currentRoom.actions.find(
    (op) => op.name === playerInput
  );

  if (action !== undefined) {
    return new Command({
      update: {
        lastAction: action,
      },
      goto: "action",
    });
  }

  return new Command({
    goto: "inputFailure",
  });
};
