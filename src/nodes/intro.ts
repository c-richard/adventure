import { Renderer } from "../renderer";
import { Adventure } from "../types";

export const Intro = (adventure: Adventure) => async () => {
  Renderer.intro(adventure.title, adventure.intro);
};
