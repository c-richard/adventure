import adventureJson from "../../adventure.json";
import { Adventure } from "../types";
import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { Intro } from "./nodes/intro";
import { StateAnnotation } from "./state";
import { NODES } from "./nodes";
import { InputGraph } from "./nodes/input";
import { Look } from "./nodes/look";
import { Failure } from "./nodes/failure";
import { Action } from "./nodes/action";

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
