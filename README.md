# CodeCollab

CodeCollab is a small real-time collaborative code editor. Its purpose is to let multiple people work on the same code in one room, discuss it through chat, and see the result of a run together.

It can be used for pair programming, teaching, group practice, or quick coding demos.

> **Security warning:** The server runs JavaScript, TypeScript, and Python with the host process's permissions. The project has no authentication or code sandbox, so do not expose it to untrusted users.

## What CodeCollab does

- Create a room or join an existing room with a room code.
- Synchronize one shared code buffer in real time.
- Show online room members.
- Send chat messages to everyone in the room.
- Choose a shared language: JavaScript, TypeScript, Python, HTML, or CSS.
- Run JavaScript, TypeScript, and Python on the server.
- Preview HTML and CSS in the browser.
- Show the latest run output to everyone in the room.
- Download the current code from the editor.

The client is built with React and Vite. The server uses Node.js, Express, Socket.IO, and Yjs. Chat and run events use Socket.IO, while the shared editor document uses a Yjs WebSocket.

## Requirements

- Node.js `18` or newer.
- npm.
- Python 3 if you want to run Python code.
- ngrok if you want to open the project from another device or browser outside your local network.

The repository contains two applications:

```text
client/   React and Vite frontend
server/   Node.js, Express, Socket.IO, and Yjs backend
```

## Run the project locally

Open two terminals from the project root.

### 1. Start the server

In the first terminal:

```bash
cd server
npm install
npm run dev
```

The server runs at:

```text
http://localhost:3001
```

### 2. Start the client

In the second terminal:

```bash
cd client
npm install
npm run dev
```

Open this URL in your browser:

```text
http://localhost:5173
```

Create a room, then enter the same room code in another browser to collaborate.

## Run everything on one port

Build the client first, then start the server. The server can serve the generated `client/dist` folder.

```bash
cd client
npm install
npm run build

cd ../server
npm install
npm start
```

Open `http://localhost:3001` after the server starts. Make sure the client build finishes before starting the server.

## Optional: expose it with ngrok

For a development server on port `5173`:

```bash
ngrok http 5173
```

For a built application served by the backend on port `3001`:

```bash
ngrok http 3001
```

Use the URL printed by ngrok. Stop the tunnel when you are finished.

## Important notes

- Room data is stored in memory and is lost when the server restarts.
- The application has no login, database, or permanent room history.
- TypeScript is transpiled but is not type-checked.
- Python must be installed on the machine running the server.
- The server currently supports a normal limit of five UI clients per room.
