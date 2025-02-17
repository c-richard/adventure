import { GraphState } from "../state";
import { Renderer } from "../../renderer";

export const Look = async (state: GraphState) => {
  Renderer.room(state.currentRoom);
};
