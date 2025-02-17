import { GraphState } from "../state";
import { Renderer } from "../../renderer";
import { getRoom } from "../../utils";

export const Look = async (state: GraphState) => {
  const currentRoom = getRoom(state.currentAdventure, state.currentRoomKey);
  Renderer.room(currentRoom);
};
