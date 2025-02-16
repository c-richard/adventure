import { Annotation } from "@langchain/langgraph";
import { Room, Action, Adventure } from "./types";
import { getRoom } from "./utils";

export const StateAnnotation = (adventure: Adventure) =>
  Annotation.Root({
    currentRoom: Annotation<Room>({
      reducer: (_, u) => u,
      default: () => getRoom(adventure, adventure.initialRoom),
    }),
    actionHistory: Annotation<string[]>({
      reducer: (s, u) => s.concat(u),
      default: () => [],
    }),
    ended: Annotation<string>,
    failedAction: Annotation<string>,
    lastAction: Annotation<Action>,
  });

export type GraphState = ReturnType<typeof StateAnnotation>["State"];
