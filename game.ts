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
import { trimMessages } from "@langchain/core/messages";

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

const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  plot: Annotation<string>(),
});

const callModel = async (state: typeof GraphAnnotation.State) => {
  const trimmedMessages = await trimmer.invoke(state.messages);
  const prompt = await promptTemplate.invoke({
    messages: trimmedMessages,
    plot: state.plot,
  });

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
