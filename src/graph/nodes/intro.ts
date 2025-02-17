import { Renderer } from "../../renderer";
import { GraphState } from "../state";

export const Intro = async (state: GraphState) => {
  Renderer.intro(state.currentAdventure.title, state.currentAdventure.intro);
};
