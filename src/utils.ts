import readlineSync from "readline-sync";
import { Adventure } from "./types";

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
