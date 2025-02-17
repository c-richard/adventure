export const NODES = {
  INTRO: "introNode",
  PLAYER_INPUT: "playerInputNode",
  LOOK: "lookNode",
  FAILURE: "FailureNode",
  ACTION: "ActionNode",
  END: "__end__",
} as const;

export type NodeType = (typeof NODES)[keyof typeof NODES];
