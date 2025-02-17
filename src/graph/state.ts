import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { Action, Adventure } from "../types";

export const StateAnnotation = (adventure: Adventure) =>
  Annotation.Root({
    currentAdventure: Annotation<Adventure>({
      reducer: (_, u) => u,
      default: () => adventure,
    }),
    currentRoomKey: Annotation<string>({
      reducer: (_, u) => u,
      default: () => adventure.initialRoom,
    }),
    actionHistory: Annotation<string[]>({
      reducer: (s, u) => s.concat(u),
      default: () => [],
    }),
    ended: Annotation<string>,
    failedAction: Annotation<string>,
    lastAction: Annotation<Action>,
    ...MessagesAnnotation.spec,
  });

export type GraphState = ReturnType<typeof StateAnnotation>["State"];
