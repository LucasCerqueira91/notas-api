import assert from "node:assert/strict";
import test from "node:test";
import { createApplication } from "../app.js";
import { createInMemoryTaskStore } from "../store/task-store.js";
import { createTaskHttpServer } from "./server.js";

async function withHttpServer<T>(
  run: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const ids = [
    "0f8fad5b-d9cb-469f-a165-70867728950e",
    "0f8fad5b-d9cb-469f-a165-70867728951e",
  ];
  const application = createApplication(
    createInMemoryTaskStore(() => {
      const id = ids.shift();
      if (!id) {
        throw new Error("Test task ID sequence exhausted");
      }

      return id;
    }),
  );
  const server = createTaskHttpServer(application.taskService);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    throw new Error("HTTP server did not bind to a TCP port");
  }

  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("supports creating, listing, completing, and removing tasks", async () => {
  await withHttpServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "  First task  " }),
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as {
      id: string;
      title: string;
      status: string;
    };
    assert.deepEqual(created, {
      id: "0f8fad5b-d9cb-469f-a165-70867728950e",
      title: "First task",
      status: "open",
    });

    const secondResponse = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Second task" }),
    });
    assert.equal(secondResponse.status, 201);
    const second = (await secondResponse.json()) as { id: string };

    const defaultList = await fetch(`${baseUrl}/tasks`);
    assert.equal(defaultList.status, 200);
    assert.deepEqual(
      await defaultList.json(),
      [
        created,
        {
          id: second.id,
          title: "Second task",
          status: "open",
        },
      ],
    );

    const completeResponse = await fetch(
      `${baseUrl}/tasks/${created.id}/complete`,
      { method: "PATCH" },
    );
    assert.equal(completeResponse.status, 200);
    assert.deepEqual(await completeResponse.json(), {
      ...created,
      status: "done",
    });

    const repeatedCompleteResponse = await fetch(
      `${baseUrl}/tasks/${created.id}/complete`,
      { method: "PATCH" },
    );
    assert.equal(repeatedCompleteResponse.status, 200);
    assert.equal(
      (await repeatedCompleteResponse.json() as { status: string }).status,
      "done",
    );

    const doneList = await fetch(`${baseUrl}/tasks?filter=done`);
    assert.deepEqual(await doneList.json(), [{ ...created, status: "done" }]);
    const openList = await fetch(`${baseUrl}/tasks?filter=open`);
    assert.deepEqual(await openList.json(), [
      { id: second.id, title: "Second task", status: "open" },
    ]);

    const deleteResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
      method: "DELETE",
    });
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), "");
    assert.deepEqual(await (await fetch(`${baseUrl}/tasks`)).json(), [
      { id: second.id, title: "Second task", status: "open" },
    ]);
  });
});

test("returns explicit client errors for invalid input and filters", async () => {
  await withHttpServer(async (baseUrl) => {
    const invalidJson = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assert.equal(invalidJson.status, 400);
    assert.equal(typeof (await invalidJson.json() as { message?: unknown }).message, "string");

    const invalidTitle = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: " " }),
    });
    assert.equal(invalidTitle.status, 400);

    const invalidFilter = await fetch(`${baseUrl}/tasks?filter=pending`);
    assert.equal(invalidFilter.status, 400);
    assert.equal(typeof (await invalidFilter.json() as { message?: unknown }).message, "string");

    const duplicateFilters = await fetch(
      `${baseUrl}/tasks?filter=open&filter=done`,
    );
    assert.equal(duplicateFilters.status, 400);

    const invalidIdResponse = await fetch(
      `${baseUrl}/tasks/not-a-uuid/complete`,
      { method: "PATCH" },
    );
    assert.equal(invalidIdResponse.status, 400);
  });
});

test("returns not found for unknown task IDs and routes", async () => {
  await withHttpServer(async (baseUrl) => {
    const missingId = "0f8fad5b-d9cb-469f-a165-70867728959e";
    const completeResponse = await fetch(
      `${baseUrl}/tasks/${missingId}/complete`,
      { method: "PATCH" },
    );
    assert.equal(completeResponse.status, 404);
    assert.equal(typeof (await completeResponse.json() as { message?: unknown }).message, "string");

    const deleteResponse = await fetch(`${baseUrl}/tasks/${missingId}`, {
      method: "DELETE",
    });
    assert.equal(deleteResponse.status, 404);

    const unknownRoute = await fetch(`${baseUrl}/unknown`);
    assert.equal(unknownRoute.status, 404);
    assert.equal(typeof (await unknownRoute.json() as { message?: unknown }).message, "string");
  });
});
