import "cheerio";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import {
  createReactAgent,
  ToolNode,
  toolsCondition,
} from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { BaseMessage, isAIMessage } from "@langchain/core/messages";

const prettyPrint = (message: BaseMessage) => {
  let txt = `[${message._getType()}]: ${message.content}`;
  if ((isAIMessage(message) && message.tool_calls?.length) || 0 > 0) {
    const tool_calls = (message as AIMessage)?.tool_calls
      ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
      .join("\n");
    txt += ` \nTools: \n${tool_calls}`;
  }
  console.log(txt);
};

const cheerioLoader = new CheerioWebBaseLoader(
  "https://memory-alpha.fandom.com/wiki/Lower_intestinal_tract",
  {
    selector: "p",
  }
);

const embeddings = new OllamaEmbeddings({
  model: "mistral:7b",
});

const vectorStore = new MemoryVectorStore(embeddings);

const model = new ChatOllama({
  model: "mistral:7b",
  baseUrl: "http://localhost:11434",
});

const retreiveSchema = z.object({ query: z.string() });

const start = async () => {
  const docs = await cheerioLoader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(allSplits);

  const randomTool = tool(
    async () => {
      console.log("rolling");
      return Math.random().toString();
    },
    {
      name: "random number generator",
      description: "Generates a random floating point number",
      schema: z.never(),
      responseFormat: "content",
    }
  );

  const retreiveTool = tool(
    async ({ query }) => {
      console.log("retreiving");
      const retreivedDocs = await vectorStore.similaritySearch(query, 2);
      const serialised = retreivedDocs
        .map((d) => `Source: ${d.metadata.source}\nContent: ${d.pageContent}`)
        .join("\n");
      return [serialised, retreivedDocs];
    },
    {
      name: "retreive",
      description: "Retreive information related to query",
      schema: retreiveSchema,
      responseFormat: "content_and_artifact",
    }
  );

  const agent = createReactAgent({
    llm: model,
    tools: [retreiveTool, randomTool],
  });

  let result = await agent.invoke({
    messages: ["Give me a random float"],
  });

  result.messages.map(prettyPrint);

  // console.log("----\n");

  // result = await agent.invoke({
  //   messages: ["What is my name?"],
  // });

  // console.log(result.messages[result.messages.length - 1].content);

  // const result2 = await graph.invoke({
  //   messages: ["Who does what?"],
  // });

  // console.log(result2.messages[result2.messages.length - 1].content);
};

start();
