import chalk from "chalk";
import readlineSync from "readline-sync";
import adventureJson from "./adventure.json";

type Adventure = {
  title: string;
  intro: string;
  initialRoom: string;
  rooms: Record<
    string,
    {
      title: string;
      description: string;
      options: {
        action: string;
        result: string;
        next_room?: string;
        end_game?: boolean;
        conditions?: {
          requiredAction?: string;
        };
      }[];
    }
  >;
};

const adventure = adventureJson as Adventure;

console.log(
  chalk.blueBright(adventure.title),
  chalk.blue("(type quit to exit)")
);
console.log();
console.log(chalk.yellow(adventure.intro));
console.log();

let currentRoom =
  adventure.rooms[adventure.initialRoom as keyof typeof adventure.rooms];

let actionHistory: string[] = [];

while (true) {
  const line = readlineSync.question(" > ").trim();
  console.log();

  if (line === "quit") {
    break;
  }

  if (line === "look") {
    console.log(chalk.green(currentRoom.title));
    console.log(chalk.yellow(currentRoom.description));
    console.log();
    continue;
  }

  const matchingOption = currentRoom.options.find((op) => op.action === line);
  if (matchingOption !== undefined) {
    const requiredAction = matchingOption.conditions?.requiredAction;
    if (requiredAction && actionHistory.includes(requiredAction) === false) {
      console.log(chalk.yellow("I can't help with that\n"));
      continue;
    }

    actionHistory.push(matchingOption.action);

    console.log(chalk.yellow(matchingOption.result));
    console.log();

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

  console.log(chalk.yellow("I can't help with that\n"));
}
