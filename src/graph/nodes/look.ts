import { GraphState } from "../state.js";
import { Renderer } from "../../renderer.js";
import { getRoom } from "../../utils.js";

export const Look = async (state: GraphState) => {
  const currentRoom = getRoom(state.currentAdventure, state.currentRoomKey);
  return {
    output: [Renderer.room(currentRoom)],
  };
};
