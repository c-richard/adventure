import events from "events";

import { Command } from "@langchain/langgraph";
import { graph } from "./graph/graph";
import { eventsWithCurrentChain, getPlayerInput } from "./utils";
import { Renderer } from "./renderer";
import { NODES } from "./graph/nodes";

events.EventEmitter.defaultMaxListeners = 20;

const main = async () => {
  const config = { configurable: { thread_id: "1" } };
  await graph.invoke({}, config);

  while (true) {
    const events = await graph.streamEvents(
      new Command({ resume: getPlayerInput() }),
      { ...config, version: "v2" }
    );

    await Renderer.chunks(eventsWithCurrentChain(events), [NODES.FAILURE]);

    const state = await graph.getState(config);

    if (state.values.ended) {
      break;
    }
  }
};

main();
