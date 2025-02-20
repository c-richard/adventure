import { Action, Room } from "./types.js";

export class Renderer {
  public static actionEffect(action: Action) {
    return `${action.result}\n`;
  }

  public static room(room: Room) {
    return `${room.title}\n${room.description}\n`;
  }

  public static intro(title: string, intro: string) {
    return `${title} (type quit to exit)\n${intro}\n`;
  }
}
