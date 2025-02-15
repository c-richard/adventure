import { ChatOllama } from "@langchain/ollama";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import readlineSync from "readline-sync";

const model = new ChatOllama({
  model: "mistral:7b",
  baseUrl: "http://localhost:11434",
});

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await model.invoke(state.messages);
  return { messages: response };
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

const start = async () => {
  const config = { configurable: { thread_id: uuidv4() } };

  console.log(
    ` ${config.configurable.thread_id} (type "exit" to end session) `
  );

  let input = readlineSync.question(" > ");

  while (input !== "exit") {
    const output = await app.invoke(
      {
        messages: [
          {
            role: "user",
            content: input,
          },
        ],
      },
      config
    );

    console.log(output.messages[output.messages.length - 1].content);
    input = readlineSync.question(" > ");
  }
};

start();
