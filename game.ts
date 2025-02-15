import "cheerio";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

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

const start = async () => {
  const docs = await cheerioLoader.load();

  console.log(`Total characters: ${docs[0].pageContent.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  await vectorStore.addDocuments(allSplits);

  const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  const InputStateAnnotation = Annotation.Root({
    question: Annotation<string>,
  });

  const StateAnnotation = Annotation.Root({
    question: Annotation<string>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
  });

  const retreive = async (state: typeof InputStateAnnotation.State) => {
    const retreivedDocs = await vectorStore.similaritySearch(state.question);
    return { context: retreivedDocs };
  };

  const generate = async (state: typeof StateAnnotation.State) => {
    const docsContent = state.context;

    const messages = await promptTemplate.invoke({
      question: state.question,
      context: docsContent,
    });
    const response = await model.invoke(messages);
    return { answer: response.content };
  };

  // Compile application and test
  const graph = new StateGraph(StateAnnotation)
    .addNode("retrieve", retreive)
    .addNode("generate", generate)
    .addEdge("__start__", "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", "__end__")
    .compile();

  console.log("A");

  let inputs = { question: "Do hirogen collect intestines?" };

  const result = await graph.invoke(inputs);
  console.log(result.answer);
};

start();
