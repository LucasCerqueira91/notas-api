import assert from "node:assert/strict";
import test from "node:test";
import { TaskNotFoundError } from "../domain/errors.js";
import { createInMemoryTaskStore } from "../store/task-store.js";
import { createTaskService } from "./task-service.js";

const taskIds = [
  "0f8fad5b-d9cb-469f-a165-70867728950e",
  "0f8fad5b-d9cb-469f-a165-70867728951e",
];

function createService() {
  const ids = [...taskIds];
  const store = createInMemoryTaskStore(() => {
    const id = ids.shift();
    if (!id) {
      throw new Error("Test task ID sequence exhausted");
    }

    return id;
  });

  return { service: createTaskService(store), store };
}

test("creates open tasks with trimmed titles", () => {
  const { service } = createService();

  assert.deepEqual(service.create("  Prepare release  "), {
    id: taskIds[0],
    title: "Prepare release",
    status: "open",
  });
});

test("rejects invalid titles before writing to the store", () => {
  const { service } = createService();

  assert.throws(() => service.create("   "), /Too small/);
  assert.throws(() => service.create("x".repeat(201)), /Too big/);
  assert.deepEqual(service.list(), []);
});

test("lists all tasks by default in creation order", () => {
  const { service, store } = createService();
  service.create("First");
  service.create("Second");

  assert.deepEqual(
    service.list().map(({ title }) => title),
    ["First", "Second"],
  );
  assert.deepEqual(
    service.list("all").map(({ title }) => title),
    ["First", "Second"],
  );
  assert.deepEqual(
    store.list("all").map(({ title }) => title),
    ["First", "Second"],
  );
});

test("lists tasks by open and done status", () => {
  const { service, store } = createService();
  const first = service.create("First");
  service.create("Second");
  store.complete(first.id);

  assert.deepEqual(
    service.list("open").map(({ title }) => title),
    ["Second"],
  );
  assert.deepEqual(
    service.list("done").map(({ title }) => title),
    ["First"],
  );
});

test("completes tasks idempotently", () => {
  const { service } = createService();
  const created = service.create("Ship release");

  assert.deepEqual(service.complete(created.id), {
    ...created,
    status: "done",
  });
  assert.deepEqual(service.complete(created.id), {
    ...created,
    status: "done",
  });
  assert.deepEqual(service.list("open"), []);
});

test("removes tasks from subsequent listings", () => {
  const { service } = createService();
  const removed = service.create("Discard draft");
  const retained = service.create("Keep draft");

  service.remove(removed.id);

  assert.deepEqual(service.list().map(({ id }) => id), [retained.id]);
  assert.deepEqual(service.list("open").map(({ id }) => id), [retained.id]);
  assert.deepEqual(service.list("done"), []);
});

test("reports missing tasks when completing or removing", () => {
  const { service } = createService();
  const task = service.create("Temporary");
  service.remove(task.id);

  assert.throws(() => service.complete(task.id), TaskNotFoundError);
  assert.throws(() => service.remove(task.id), TaskNotFoundError);
  assert.throws(() => service.complete(taskIds[1]), TaskNotFoundError);
  assert.throws(() => service.remove(taskIds[1]), TaskNotFoundError);
});
