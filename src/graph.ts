import adventureJson from "../adventure.json";
import { Adventure } from "./types";
import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { Intro } from "./nodes/intro";
import { StateAnnotation } from "./graphState";
import { Input } from "./nodes/input";
import { Look } from "./nodes/look";
import { Failure } from "./nodes/failure";
import { Action } from "./nodes/action";

const adventure = adventureJson as Adventure;

export const graph = new StateGraph(StateAnnotation(adventure))
  .addNode("intro", Intro(adventure))
  .addNode("playerInput", Input, {
    ends: ["__end__", "look", "inputFailure", "action"],
  })
  .addNode("look", Look)
  .addNode("inputFailure", Failure)
  .addNode("action", Action(adventure), {
    ends: ["inputFailure", "playerInput"],
  })
  .addEdge("__start__", "intro")
  .addEdge("intro", "playerInput")
  .addEdge("look", "playerInput")
  .addEdge("inputFailure", "playerInput")
  .compile({ checkpointer: new MemorySaver() });
