import readlineSync from "readline-sync";
import { Adventure } from "./types";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { StreamEvent } from "@langchain/core/dist/tracers/event_stream";

export function getPlayerInput() {
  const line = readlineSync.question(" > ").trim();
  console.log();
  return line;
}

export const getRoom = (
  adventure: Adventure,
  roomKey: keyof typeof adventure.rooms
) => {
  return adventure.rooms[roomKey];
};

export async function* eventsWithCurrentChain(
  events: IterableReadableStream<StreamEvent>
) {
  let currentChain: string = "";

  for await (const e of events) {
    if (e.event === "on_chain_start") {
      currentChain = e.name;
    }

    yield [currentChain, e] as [string, StreamEvent];
  }
}
