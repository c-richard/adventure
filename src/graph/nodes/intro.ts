import { Renderer } from "../../renderer.js";
import { getRoom } from "../../utils.js";
import { GraphState } from "../state.js";

export const Intro = async (state: GraphState) => {
  return {
    output: [
      Renderer.intro(
        state.currentAdventure.title,
        state.currentAdventure.intro
      ),
      Renderer.room(getRoom(state.currentAdventure, state.currentRoomKey)),
    ],
  };
};
