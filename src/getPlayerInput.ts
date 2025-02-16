import readlineSync from "readline-sync";

export function getPlayerInput() {
  const line = readlineSync.question(" > ").trim();
  console.log();
  return line;
}
