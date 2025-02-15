import "cheerio";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";

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

  console.log(`Total characters: ${docs[0].pageContent.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(allSplits);

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

  async function queryOrResponse(state: typeof MessagesAnnotation.State) {
    console.log("query or respond");
    const modelWithTools = model.bindTools([retreiveTool]);
    const response = await modelWithTools.invoke(state.messages);
    return { messages: [response] };
  }

  const tools = new ToolNode([retreiveTool]);

  // Step 3: Generate a response using the retrieved content.
  async function generate(state: typeof MessagesAnnotation.State) {
    console.log("generating");
    // Get generated ToolMessages
    let recentToolMessages = [];
    for (let i = state["messages"].length - 1; i >= 0; i--) {
      let message = state["messages"][i];
      if (message instanceof ToolMessage) {
        recentToolMessages.push(message);
      } else {
        break;
      }
    }
    let toolMessages = recentToolMessages.reverse();

    // Format into prompt
    const docsContent = toolMessages.map((doc) => doc.content).join("\n");
    const systemMessageContent =
      "You are an assistant for question-answering tasks. " +
      "Use the following pieces of retrieved context to answer " +
      "the question. If you don't know the answer, say that you " +
      "don't know. Use three sentences maximum and keep the " +
      "answer concise." +
      "\n\n" +
      `${docsContent}`;

    const conversationMessages = state.messages.filter(
      (message) =>
        message instanceof HumanMessage ||
        message instanceof SystemMessage ||
        (message instanceof AIMessage && message?.tool_calls?.length == 0)
    );
    const prompt = [
      new SystemMessage(systemMessageContent),
      ...conversationMessages,
    ];

    // Run
    const response = await model.invoke(prompt);
    return { messages: [response] };
  }

  const graphBuilder = new StateGraph(MessagesAnnotation)
    .addNode("queryOrRespond", queryOrResponse)
    .addNode("tools", tools)
    .addNode("generate", generate)
    .addEdge("__start__", "queryOrRespond")
    .addConditionalEdges("queryOrRespond", toolsCondition, {
      __end__: "__end__",
      tools: "tools",
    })
    .addEdge("tools", "generate")
    .addEdge("generate", "__end__");

  const graph = graphBuilder.compile();

  const result = await graph.invoke({
    messages: ["What is a fish?"],
  });

  console.log(result.messages[result.messages.length - 1].content);

  // const result2 = await graph.invoke({
  //   messages: ["Who does what?"],
  // });

  // console.log(result2.messages[result2.messages.length - 1].content);
};

start();
