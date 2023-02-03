# Description
NodeJS application (Server and Client) that would utilize WebSocket transport and use json as a contract based approach.

Server handles 3 methods: Subscribe, Unsubscribe, CountSubscribers.

Subscribe (response delay 4 seconds):
```
{
  "type": "Subscribe", "status": "Subscribed", "updatedAt": ***
}
```

Unsubscribe (response delay 8 seconds):
```
{
  "type": "Unsubscribe", "status": "Unsubscribed", "updatedAt": ***
}
```

CountSubscribers:
```
{
  "type": "CountSubscribers", "count": *** "updatedAt": ***
}
```

Errors:
```
{
 "type": "Error",
 "error": "Requested method not implemented", "updatedAt": ***
}

{
  "type": "Error",
  "error": "Bad formatted payload, non JSON", "updatedAt": ***
}
```

Server produces heartbeat events every second:
```
{
  "type": "Heartbeat", "updatedAt": ***
}
```

### Setup

```
npm install
```

### Run WebSocket server

```
npm run start:server
```

### Run WebSocket client

```
npm run start:client
```

### Run tests

```
npm run test
```
