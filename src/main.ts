import adventureJson from "../adventure.json";
import { Adventure } from "./types";
import { Renderer } from "./renderer";
import { getPlayerInput } from "./getPlayerInput";

const adventure = adventureJson as Adventure;

Renderer.intro(adventure.title, adventure.intro);

let currentRoom =
  adventure.rooms[adventure.initialRoom as keyof typeof adventure.rooms];

let actionHistory: string[] = [];

while (true) {
  const line = getPlayerInput();

  if (line === "quit") {
    break;
  }

  if (line === "look") {
    Renderer.room(currentRoom);
    continue;
  }

  const matchingOption = currentRoom.options.find((op) => op.action === line);
  if (matchingOption !== undefined) {
    const requiredAction = matchingOption.conditions?.requiredAction;
    if (requiredAction && actionHistory.includes(requiredAction) === false) {
      Renderer.inputFailure();
      continue;
    }

    actionHistory.push(matchingOption.action);

    Renderer.actionEffect(matchingOption);

    if (matchingOption.next_room !== undefined) {
      currentRoom =
        adventure.rooms[
          matchingOption.next_room as keyof typeof adventure.rooms
        ];
    }

    if (matchingOption.end_game) {
      break;
    }

    continue;
  }

  Renderer.inputFailure();
}
