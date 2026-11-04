import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Server } from "node:http";
import { createApplication } from "./app.js";
import { createTaskHttpServer } from "./http/server.js";

export function startTaskHttpServer(
  port = 3000,
  host = "127.0.0.1",
): Server {
  const application = createApplication();
  const server = createTaskHttpServer(application.taskService);

  server.listen(port, host, () => {
    console.log(`Task API listening at http://${host}:${port}`);
  });

  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  startTaskHttpServer();
}