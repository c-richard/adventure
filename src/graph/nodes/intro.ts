import { Renderer } from "../../renderer";
import { getRoom } from "../../utils";
import { GraphState } from "../state";

export const Intro = async (state: GraphState) => {
  Renderer.intro(state.currentAdventure.title, state.currentAdventure.intro);
  Renderer.room(getRoom(state.currentAdventure, state.currentRoomKey));
};
