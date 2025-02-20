import adventureJson from "../../adventure.json" assert { type: "json" };
import { Adventure } from "../types.js";
import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { Intro } from "./nodes/intro.js";
import { StateAnnotation } from "./state.js";
import { NODES } from "./nodes.js";
import { InputGraph } from "./nodes/input.js";
import { Look } from "./nodes/look.js";
import { Failure } from "./nodes/failure.js";
import { Action } from "./nodes/action.js";

const adventure = adventureJson as Adventure;

export const graph = new StateGraph(StateAnnotation(adventure))
  .addNode(NODES.INTRO, Intro)
  .addNode(NODES.PLAYER_INPUT, InputGraph, {
    ends: ["__end__", NODES.LOOK, NODES.FAILURE, NODES.ACTION],
  })
  .addNode(NODES.LOOK, Look)
  .addNode(NODES.FAILURE, Failure)
  .addNode(NODES.ACTION, Action, {
    ends: [NODES.FAILURE, NODES.PLAYER_INPUT],
  })
  .addEdge("__start__", NODES.INTRO)
  .addEdge(NODES.INTRO, NODES.PLAYER_INPUT)
  .addEdge(NODES.LOOK, NODES.PLAYER_INPUT)
  .addEdge(NODES.FAILURE, NODES.PLAYER_INPUT)
  .compile({ checkpointer: new MemorySaver() });
