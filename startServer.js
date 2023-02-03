import { createWebSocketServer } from "./src/server.js";
const PORT = Number(process.env.PORT) || 9000;

const start = async () => {
  createWebSocketServer(PORT);
};

start().catch(console.error);
