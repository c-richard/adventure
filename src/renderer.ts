import chalk from "chalk";
import { Action, Room } from "./types";

export class Renderer {
  public static actionEffect(action: Action) {
    console.log(chalk.yellow(action.result));
    console.log();
  }

  public static inputFailure() {
    console.log(chalk.yellow("I can't help with that"));
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
}
