import { Command } from "@langchain/langgraph";
import { graph } from "./graph";
import { getPlayerInput } from "./utils";

const main = async () => {
  const config = { configurable: { thread_id: "1" } };
  await graph.invoke({}, config);

  while (true) {
    const state = await graph.invoke(
      new Command({ resume: getPlayerInput() }),
      config
    );

    if (state.ended) {
      break;
    }
  }
};

main();
