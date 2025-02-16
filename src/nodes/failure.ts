import { ChatOllama } from "@langchain/ollama";
import { GraphState } from "../graphState";
import { Renderer } from "../renderer";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOllama({
  model: "llama3.2:3b",
});

const promptTemplate = PromptTemplate.fromTemplate(
  `
    You are in a text adventure game.
    The player is currently in the {roomTitle} room described as: {roomDescription}.
    The player just entered the command: '{failedAction}'.

    If the command is possible, provide a brief, one-sentence response to the outcome.
    If the command isn't possible or doesn't make sense, briefly explain why in one sentence, either with a short reason or description of why it's impractical.

    Responses should be concise, no more than one sentence, and should not impact the story, the room or the players location
  `
);

export const Failure = async (state: GraphState) => {
  const failedAction = state.failedAction;

  const prompt = await promptTemplate.invoke({
    roomTitle: state.currentRoom.title,
    roomDescription: state.currentRoom.description,
    failedAction,
  });

  const response = await model.invoke(prompt);

  const reason = response.content.toString();

  Renderer.inputFailure(reason);
};
