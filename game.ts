import { ChatOllama } from "@langchain/ollama";
import {
  Annotation,
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import readlineSync from "readline-sync";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const model = new ChatOllama({
  model: "mistral:7b",
  baseUrl: "http://localhost:11434",
});

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are the narrator of a text adventure game. The player is on an adventure that follows this plot: {plot}. Respond based on the player's actions, which will shape the progression of the story. Describe the environment and choices the player faces at each step, and await their response to continue the narrative. Ensure that the player's actions drive the story forward.",
  ],
  [
    "assistant",
    "You, as the narrator, describe the consequences of the player's action. Include details about the environment and any immediate changes. Maintain the flow of the story with the player's choices influencing what happens next. The story should evolve based on the player's interactions.",
  ],
  ["placeholder", "{messages}"],
]);

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  plot: Annotation<string>(),
});

const callModel = async (state: typeof GraphAnnotation.State) => {
  const prompt = await promptTemplate.invoke(state);
  const response = await model.invoke(prompt);
  return { messages: response };
};

const workflow = new StateGraph(GraphAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

const app = workflow.compile({ checkpointer: new MemorySaver() });

const start = async () => {
  const config = { configurable: { thread_id: uuidv4() } };

  console.log(
    ` ${config.configurable.thread_id} (type "exit" to end session) `
  );

  let input = "look";

  while (input !== "exit") {
    const output = await app.invoke(
      {
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
        plot: "Escape a ship at sea",
      },
      config
    );

    console.log(output.messages[output.messages.length - 1].content);
    input = readlineSync.question(" > ");
  }
};

start();
