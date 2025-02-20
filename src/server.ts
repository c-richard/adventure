import events from "events";

import { Command } from "@langchain/langgraph";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { graph } from "./graph/graph.js";
import express from "express";
import path from "path";

events.EventEmitter.defaultMaxListeners = 20;

const config = { configurable: { thread_id: "1" } };
await graph.invoke({}, config);
const state = await graph.getState(config);

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
let messages: string[] = state.values.output;

app.use(express.static("static"));
app.use(express.json());

app.get("/chat", (_, res) => {
  res.send(JSON.stringify(messages));
});

app.post("/chat", async (req, res) => {
  messages.push(req.body.text);

  await graph.invoke(new Command({ resume: req.body.text }), config);
  const state = await graph.getState(config);
  messages = state.values.output;

  res.send(JSON.stringify(state.values.output));
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "static/index.html"));
});

app.listen(3001, () => {
  console.log("Server started");
  console.log("http://localhost:3001/");
});
