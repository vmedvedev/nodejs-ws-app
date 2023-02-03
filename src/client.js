import WebSocket from "ws";
import { v4 as uuid4 } from "uuid";
const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 9000;
const OPEN = 1;

export const subscribe = (ws, id) => {
  const payload = {
    id: id ?? uuid4(),
    type: "Subscribe",
  };

  ws.send(JSON.stringify(payload));
};

export const unsubscribe = (ws, id) => {
  const payload = {
    id: id ?? uuid4(),
    type: "Unsubscribe",
  };

  ws.send(JSON.stringify(payload));
};

export const countSubscribers = (ws) => {
  const payload = {
    id: uuid4(),
    type: "CountSubscribers",
  };

  ws.send(JSON.stringify(payload));
};

export const waitForSocketState = (socket, state) => {
  return new Promise((resolve) => {
    setTimeout(function () {
      if (socket.readyState === state) {
        resolve();
      } else {
        waitForSocketState(socket, state).then(resolve);
      }
    }, 100);
  });
};

export const createWebSocketClient = async (host, port) => {
  const ws = new WebSocket(
    `ws://${host ?? DEFAULT_HOST}:${port ?? DEFAULT_PORT}`
  );
  ws.on("error", console.error);
  ws.on("open", function open() {
    console.log("WebSocket is opened");
  });

  await waitForSocketState(ws, OPEN);

  return ws;
};
