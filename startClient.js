import { createWebSocketClient, subscribe, unsubscribe, countSubscribers } from "./src/client.js";
const host = process.env.HOST || "localhost";
const port = Number(process.env.PORT) || 9000;

const start = async () => {
  const wsClient = await createWebSocketClient(host, port);

  wsClient.on("message", (message) => {
    console.log(`Received message: ${message}`);
    // wsClient.close();
  });

  subscribe(wsClient);
  countSubscribers(wsClient);
  unsubscribe(wsClient);
}

start().catch(console.error);
