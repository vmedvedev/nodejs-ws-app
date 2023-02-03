const WebSocket = require("ws");
import { createWebSocketServer } from "../src/server";
import { waitForSocketState } from "../src/client";

const OPEN = 1;

const startServer = (port) => {
  return new Promise((resolve) => {
    const server = createWebSocketServer(port);
    resolve(server);
  });
};

const createTestWsClient = async (host, port, onMessage) => {
  const client = new WebSocket(`ws://${host}:${port}`);
  await waitForSocketState(client, OPEN);
  client.on("message", (data) => onMessage(data, client));

  return client;
};

export { startServer, waitForSocketState, createTestWsClient };
