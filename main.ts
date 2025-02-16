import chalk from "chalk";
import readlineSync from "readline-sync";

console.log(
  chalk.greenBright("Game intro"),
  chalk.green("(type quit to exit)")
);
console.log();

while (true) {
  const line = readlineSync.question(" > ").trim();
  console.log();

  if (line === "quit") {
    break;
  }

  console.log(chalk.green("Game response\n"));
}
