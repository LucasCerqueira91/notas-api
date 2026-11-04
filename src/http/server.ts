import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { TaskNotFoundError } from "../domain/errors.js";
import {
  createTaskInputSchema,
  taskFilterSchema,
  taskIdSchema,
} from "../domain/task.js";
import type { TaskService } from "../service/task-service.js";

class BadRequestError extends Error {}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new BadRequestError("Request body must contain valid JSON");
  }
}

function decodeTaskId(encodedId: string): string {
  let id: string;
  try {
    id = decodeURIComponent(encodedId);
  } catch {
    throw new BadRequestError("Task ID is invalid");
  }

  const result = taskIdSchema.safeParse(id);
  if (!result.success) {
    throw new BadRequestError("Task ID is invalid");
  }

  return result.data;
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  taskService: TaskService,
): Promise<void> {
  let url: URL;
  try {
    url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  } catch {
    throw new BadRequestError("Request URL is invalid");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const method = request.method ?? "";

  if (segments.length === 1 && segments[0] === "tasks" && method === "POST") {
    const body = await readJsonBody(request);
    const result = createTaskInputSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestError("Task title must be a non-empty string of at most 200 characters");
    }

    sendJson(response, 201, taskService.create(result.data.title));
    return;
  }

  if (segments.length === 1 && segments[0] === "tasks" && method === "GET") {
    const filters = url.searchParams.getAll("filter");
    if (filters.length > 1) {
      throw new BadRequestError("Only one task filter may be provided");
    }

    const filterResult = taskFilterSchema.safeParse(filters[0] ?? "all");
    if (!filterResult.success) {
      throw new BadRequestError("Task filter must be all, open, or done");
    }

    sendJson(response, 200, taskService.list(filterResult.data));
    return;
  }

  if (
    segments.length === 3 &&
    segments[0] === "tasks" &&
    segments[2] === "complete" &&
    method === "PATCH"
  ) {
    const id = decodeTaskId(segments[1] ?? "");
    sendJson(response, 200, taskService.complete(id));
    return;
  }

  if (segments.length === 2 && segments[0] === "tasks" && method === "DELETE") {
    const id = decodeTaskId(segments[1] ?? "");
    taskService.remove(id);
    response.writeHead(204);
    response.end();
    return;
  }

  sendJson(response, 404, { message: "Route not found" });
}

export function createTaskHttpServer(taskService: TaskService): Server {
  return createServer((request, response) => {
    void handleRequest(request, response, taskService).catch((error: unknown) => {
      if (response.headersSent) {
        response.destroy(error instanceof Error ? error : undefined);
        return;
      }

      if (error instanceof BadRequestError || error instanceof ZodError) {
        sendJson(response, 400, { message: error.message });
        return;
      }

      if (error instanceof TaskNotFoundError) {
        sendJson(response, 404, { message: error.message });
        return;
      }

      console.error("Unhandled HTTP request error", error);
      sendJson(response, 500, { message: "Internal server error" });
    });
  });
}
