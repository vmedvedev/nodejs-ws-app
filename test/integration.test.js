const uuid = require("uuid");
import {
  startServer,
  waitForSocketState,
  createTestWsClient,
} from "./webSocketTestUtils";
import {
  subscribe,
  unsubscribe,
  countSubscribers,
  waitForSocketState,
} from "../src/client";

const host = process.env.HOST || "localhost";
const port = Number(process.env.PORT) || 9000;

jest.setTimeout(30000);

describe("Integration", () => {
  let server;
  const CLOSED = 3;

  beforeAll(async () => {
    server = await startServer(port);
  });

  afterAll(() => {
    server.clients.forEach((ws) => {
      ws.terminate();
    });
  });

  it("Server should answer with status message Subscribed and timestamp when it took place after await for 4 seconds", async () => {
    expect.assertions(4);

    let responseMessage;
    let heartbeatCount = 0;
    const HEARTBEATS = 4;

    const onMessage = (data, client) => {
      responseMessage = JSON.parse(data);

      if (responseMessage.type === "Heartbeat") {
        heartbeatCount++;
      }

      // Close the client after it receives the response
      if (responseMessage.type === "Subscribe") {
        client.terminate();
      }
    };

    // Create test client
    const client = await createTestWsClient(host, port, onMessage);

    // Send client message
    subscribe(client);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(responseMessage.type).toBe("Subscribe");
    expect(responseMessage.status).toBe("Subscribed");
    expect(responseMessage.updatedAt).toBeDefined();
    expect(heartbeatCount).toBe(HEARTBEATS);
  });

  it("Server should answer with status message Unsubscribe and timestamp when it took place after await for 8 seconds", async () => {
    expect.assertions(4);

    let responseMessage;
    let heartbeatCount = 0;
    const HEARTBEATS = 8;

    const onMessage = (data, client) => {
      responseMessage = JSON.parse(data);

      if (responseMessage.type === "Heartbeat") {
        heartbeatCount++;
      }

      // Close the client after it receives the response
      if (responseMessage.type === "Unsubscribe") {
        client.terminate();
      }
    };

    // Create test client
    const client = await createTestWsClient(host, port, onMessage);

    // Send client message
    unsubscribe(client);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(responseMessage.type).toBe("Unsubscribe");
    expect(responseMessage.status).toBe("Unsubscribed");
    expect(responseMessage.updatedAt).toBeDefined();
    expect(heartbeatCount).toBe(HEARTBEATS);
  });

  it("CountSubscribers was requested server should answer with number of current subscriptions and timestamp when it was counted", async () => {
    expect.assertions(3);

    let responseMessage;
    const expectedSubscribersCount = 1;

    const onMessage = (data, client) => {
      responseMessage = JSON.parse(data);

      // Close the client after it receives the response
      if (responseMessage.type === "CountSubscribers") {
        client.terminate();
      }
    };

    // Create test client
    const client = await createTestWsClient(host, port, onMessage);

    // Send client message
    subscribe(client);
    countSubscribers(client);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(responseMessage.type).toBe("CountSubscribers");
    expect(responseMessage.count).toBe(expectedSubscribersCount);
    expect(responseMessage.updatedAt).toBeDefined();
  });

  it("Server should produce heartbeat events every second", async () => {
    expect.assertions(8);

    let heartbeatCount = 0;
    let heartbeatMessages = [];

    const onMessage = (data, client) => {
      const responseMessage = JSON.parse(data);

      if (responseMessage.type === "Heartbeat") {
        heartbeatCount++;
        heartbeatMessages.push(responseMessage);
      }

      if (heartbeatCount === 3) {
        // Close the client after it receives 3 Heartbeat messages
        client.terminate();
      }
    };

    // Create test client
    const client = await createTestWsClient(host, port, onMessage);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(heartbeatMessages[0].type).toBe("Heartbeat");
    expect(heartbeatMessages[0].updatedAt).toBeDefined();
    expect(heartbeatMessages[1].type).toBe("Heartbeat");
    expect(heartbeatMessages[1].updatedAt).toBeDefined();
    expect(heartbeatMessages[2].type).toBe("Heartbeat");
    expect(heartbeatMessages[2].updatedAt).toBeDefined();
    expect(
      heartbeatMessages[1].updatedAt - heartbeatMessages[0].updatedAt
    ).toBeLessThan(1100);
    expect(
      heartbeatMessages[2].updatedAt - heartbeatMessages[1].updatedAt
    ).toBeLessThan(1100);
  });

  it("Server should answer with error message in case of request was made with non-than json payload", async () => {
    expect.assertions(3);

    let responseMessage;

    const onMessage = (data, client) => {
      responseMessage = JSON.parse(data);
      client.terminate();
    };

    // Create test client
    const client = await createTestWsClient(host, port, onMessage);

    const testMessage = "Test message";

    // Send client message
    client.send(testMessage);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(responseMessage.type).toBe("Error");
    expect(responseMessage.error).toBe("Bad formatted payload, non JSON");
    expect(responseMessage.updatedAt).toBeDefined();
  });

  it("Server should answer with status message Subscribed and act with idempotence", async () => {
    expect.assertions(4);

    // Create test client
    const client = await createTestWsClient(host, port, (data, client) => {
      client.terminate();
    });

    let responseMessage;

    // Create 2d test client
    const client2 = await createTestWsClient(host, port, (data, client2) => {
      responseMessage = JSON.parse(data);

      // Close the client after it receives the response
      if (responseMessage.type === "Subscribe") {
        client2.terminate();
      }
    });

    client.on("message", () => {
      client.terminate();
    });

    const requestId = uuid.v4();
    // Send client message
    subscribe(client, requestId);
    subscribe(client2, requestId);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(responseMessage.id).toBe(requestId);
    expect(responseMessage.type).toBe("Subscribe");
    expect(responseMessage.status).toBe("Subscribed");
    expect(responseMessage.updatedAt).toBeDefined();
  });

  it("Server should answer with status message Unsubscribe and act with idempotence", async () => {
    // Create test client
    const client = await createTestWsClient(host, port, (data, client) => {
      client.terminate();
    });

    let responseMessage;

    // Create 2d test client
    const client2 = await createTestWsClient(host, port, (data, client2) => {
      responseMessage = JSON.parse(data);

      // Close the client after it receives the response
      if (responseMessage.type === "Unsubscribe") {
        client2.terminate();
      }
    });

    client.on("message", () => {
      client.terminate();
    });

    const requestId = uuid.v4();
    // Send client message
    unsubscribe(client, requestId);
    unsubscribe(client2, requestId);

    // Perform assertions on the response
    await waitForSocketState(client, CLOSED);

    expect(responseMessage.id).toBe(requestId);
    expect(responseMessage.type).toBe("Unsubscribe");
    expect(responseMessage.status).toBe("Unsubscribed");
    expect(responseMessage.updatedAt).toBeDefined();
  });
});
