import adventureJson from "../adventure.json";
import { Adventure, Option, Room } from "./types";
import { Renderer } from "./renderer";
import { getPlayerInput } from "./getPlayerInput";
import {
  Annotation,
  Command,
  interrupt,
  MemorySaver,
  StateGraph,
} from "@langchain/langgraph";

const adventure = adventureJson as Adventure;

const StateAnnotation = Annotation.Root({
  currentRoom: Annotation<Room>,
  actionHistory: Annotation<string[]>,
  ended: Annotation<string>,
  lastAction: Annotation<Option>,
});

const getRoom = (roomKey: keyof typeof adventure.rooms) => {
  return adventure.rooms[roomKey];
};

const IntroNode = async () => {
  Renderer.intro(adventure.title, adventure.intro);

  return {
    currentRoom: getRoom(adventure.initialRoom),
    actionHistory: [],
  };
};

const PlayerInputNode = async (state: typeof StateAnnotation.State) => {
  const playerInput = interrupt("player_input");

  if (playerInput === "quit") {
    return new Command({
      update: {
        ended: "ended",
      },
      goto: "__end__",
    });
  }

  if (playerInput === "look") {
    return new Command({
      goto: "look",
    });
  }

  const action = state.currentRoom.options.find(
    (op) => op.action === playerInput
  );

  if (action !== undefined) {
    return new Command({
      update: {
        lastAction: action,
      },
      goto: "action",
    });
  }

  return new Command({
    goto: "inputFailure",
  });
};

const LookNode = async (state: typeof StateAnnotation.State) => {
  Renderer.room(state.currentRoom);
};

const InputFailure = async () => {
  Renderer.inputFailure();
};

const Action = async (state: typeof StateAnnotation.State) => {
  const requiredAction = state.lastAction.conditions?.requiredAction;

  if (
    requiredAction &&
    state.actionHistory.includes(requiredAction) === false
  ) {
    return new Command({
      goto: "inputFailure",
    });
  }

  Renderer.actionEffect(state.lastAction);

  return new Command({
    update: {
      actionHistory: [...state.actionHistory, state.lastAction.action],
      currentRoom: state.lastAction.next_room
        ? adventure.rooms[
            state.lastAction.next_room as keyof typeof adventure.rooms
          ]
        : state.currentRoom,
      ended: state.lastAction.end_game,
    },
    goto: "playerInput",
  });
};

const checkpointer = new MemorySaver();
const graph = new StateGraph(StateAnnotation)
  .addNode("intro", IntroNode)
  .addNode("playerInput", PlayerInputNode, {
    ends: ["__end__", "look", "inputFailure", "action"],
  })
  .addNode("look", LookNode)
  .addNode("inputFailure", InputFailure)
  .addNode("action", Action, {
    ends: ["inputFailure", "playerInput"],
  })
  .addEdge("__start__", "intro")
  .addEdge("intro", "playerInput")
  .addEdge("look", "playerInput")
  .addEdge("inputFailure", "playerInput")
  .compile({ checkpointer });

const main = async () => {
  const config = { configurable: { thread_id: "1" } };
  await graph.invoke({}, config);

  while (true) {
    const playerInput = getPlayerInput();
    const state = await graph.invoke(
      new Command({ resume: playerInput }),
      config
    );

    if (state.ended) {
      break;
    }
  }
};

main();
