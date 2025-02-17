import chalk from "chalk";
import { Action, Room } from "./types";
import { StreamEvent } from "@langchain/core/dist/tracers/event_stream";
import { AIMessageChunk } from "@langchain/core/messages";
import { NodeType } from "./graph/nodes";

export class Renderer {
  public static actionEffect(action: Action) {
    console.log(chalk.yellow(action.result));
    console.log();
  }

  public static room(room: Room) {
    console.log(chalk.green(room.title));
    console.log(chalk.yellow(room.description));
    console.log();
  }

  public static intro(title: string, intro: string) {
    console.log(chalk.blueBright(title), chalk.blue("(type quit to exit)"));
    console.log();
    console.log(chalk.yellow(intro));
    console.log();
  }

  public static async chunks(
    events: AsyncGenerator<[string, StreamEvent], void, unknown>,
    nodes: NodeType[]
  ) {
    for await (const [currentChain, e] of events) {
      if (nodes.includes(currentChain as NodeType) === false) continue;

      if (e.data.chunk instanceof AIMessageChunk) {
        process.stdout.write(chalk.yellow(e.data.chunk.content.toString()));
      }

      if (e.event === "on_chat_model_end") {
        process.stdout.write("\n\n");
      }
    }
  }
}
