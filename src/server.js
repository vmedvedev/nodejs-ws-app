import { WebSocketServer } from "ws";
const DEFAULT_PORT = 9000;
const REQUESTS = new Map();
let SubscribersCounter = 0;

const log = (message) => {
  console.log(message);
};

const subscribe = (requestId) => {
  SubscribersCounter++;
  log("Subscribe request");

  return {
    id: requestId,
    type: "Subscribe",
    status: "Subscribed",
    updatedAt: Date.now(),
  };
};

const unsubscribe = (requestId) => {
  SubscribersCounter--;
  log("Unsubscribe request");

  return {
    id: requestId,
    type: "Unsubscribe",
    status: "Unsubscribed",
    updatedAt: Date.now(),
  };
};

const countSubscribers = () => {
  log("CountSubscribers request");
  return {
    type: "CountSubscribers",
    count: SubscribersCounter,
    updatedAt: Date.now(),
  };
};

const heartbeat = (wsClient) => {
  const payload = {
    type: "Heartbeat",
    updatedAt: Date.now(),
  };

  wsClient.send(JSON.stringify(payload));
};

const sendResponseByType = (wsClient, requestType, requestId) => {
  let payload;
  let payloadJSON;

  switch (requestType) {
    case "Subscribe":
      payload = subscribe(requestId);
      payloadJSON = JSON.stringify(payload);
      REQUESTS.set(requestId, payloadJSON);
      log(`Sending response: ${payloadJSON}`);
      setTimeout(() => wsClient.send(payloadJSON), 4000);
      break;
    case "Unsubscribe":
      payload = unsubscribe(requestId);
      payloadJSON = JSON.stringify(payload);
      REQUESTS.set(requestId, payloadJSON);
      log(`Sending response: ${payloadJSON}`);
      setTimeout(() => wsClient.send(payloadJSON), 8000);
      break;
    case "CountSubscribers":
      payload = countSubscribers();
      payloadJSON = JSON.stringify(payload);
      REQUESTS.set(requestId, payloadJSON);
      log(`Sending response: ${payloadJSON}`);
      wsClient.send(payloadJSON);
      break;
    default:
      payload = {
        type: "Error",
        error: "Requested method not implemented",
        updatedAt: Date.now(),
      };
      payloadJSON = JSON.stringify(payload);
      REQUESTS.set(requestId, payloadJSON);
      log(`Sending response: ${payloadJSON}`);
      wsClient.send(payloadJSON);
  }
};

const sendResponse = (wsClient, data) => {
  let requestType;
  let requestId;

  try {
    const jsonMessage = JSON.parse(data);
    requestType = jsonMessage.type;
    requestId = jsonMessage.id;
  } catch (error) {
    const payload = {
      type: "Error",
      error: "Bad formatted payload, non JSON",
      updatedAt: Date.now(),
    };

    wsClient.send(JSON.stringify(payload));
    return;
  }

  if (REQUESTS.has(requestId)) {
    wsClient.send(REQUESTS.get(requestId));
    return;
  }

  if (requestType) {
    sendResponseByType(wsClient, requestType, requestId);
  } else {
    const payload = {
      type: "Error",
      error: "Requested method not provided",
      updatedAt: Date.now(),
    };

    log(`Sending response: ${payloadJSON}`);
    wsClient.send(JSON.stringify(payload));
  }
};

const onWssConnect = (wsClient) => {
  try {
    log("WebSocket Client is connected");

    wsClient.on("error", console.error);
    wsClient.on("close", () => {
      log("WebSocket Client is disconnected");
    });
    wsClient.on("message", (message) => {
      log(`Received message: ${message}`);
      sendResponse(wsClient, message);
    });

    setInterval(() => heartbeat(wsClient), 1000);
  } catch (error) {
    console.error(error);
  }
};

export const createWebSocketServer = (port) => {
  const wsServer = new WebSocketServer({
    port: port ?? DEFAULT_PORT,
  });
  wsServer.on("connection", onWssConnect);
  log(`Server running at port ${port}`);

  return wsServer;
};
