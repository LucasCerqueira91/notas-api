import assert from "node:assert/strict";
import test from "node:test";
import { TaskNotFoundError } from "../domain/errors.js";
import { taskIdSchema } from "../domain/task.js";
import { createInMemoryTaskStore } from "./task-store.js";

const firstId = "0f8fad5b-d9cb-469f-a165-70867728950e";
const secondId = "0f8fad5b-d9cb-469f-a165-70867728951e";

test("creates open tasks with unique UUID v4 IDs", () => {
  const store = createInMemoryTaskStore();

  const first = store.create("First");
  const second = store.create("Second");

  assert.equal(first.status, "open");
  assert.equal(second.status, "open");
  assert.equal(taskIdSchema.safeParse(first.id).success, true);
  assert.equal(taskIdSchema.safeParse(second.id).success, true);
  assert.notEqual(first.id, second.id);
});

test("rejects a generated ID collision without replacing the stored task", () => {
  const store = createInMemoryTaskStore(() => firstId);

  store.create("Original");
  assert.throws(() => store.create("Duplicate"), /ID already exists/);
  assert.equal(store.getById(firstId).title, "Original");
  assert.equal(store.list("all").length, 1);
});

test("lists all and filtered tasks in creation order", () => {
  const ids = [firstId, secondId];
  const store = createInMemoryTaskStore(() => ids.shift() ?? firstId);

  const first = store.create("First");
  store.create("Second");
  store.complete(first.id);

  assert.deepEqual(
    store.list("all").map(({ title }) => title),
    ["First", "Second"],
  );
  assert.deepEqual(
    store.list("open").map(({ title }) => title),
    ["Second"],
  );
  assert.deepEqual(
    store.list("done").map(({ title }) => title),
    ["First"],
  );
});

test("returns copies so callers cannot mutate stored tasks", () => {
  const store = createInMemoryTaskStore(() => firstId);
  const created = store.create("Original");
  created.title = "Changed";

  const retrieved = store.getById(firstId);
  retrieved.status = "done";

  assert.deepEqual(store.getById(firstId), {
    id: firstId,
    title: "Original",
    status: "open",
  });
});

test("completes tasks without changing their creation order", () => {
  const ids = [firstId, secondId];
  const store = createInMemoryTaskStore(() => ids.shift() ?? firstId);
  const first = store.create("First");
  store.create("Second");

  assert.equal(store.complete(first.id).status, "done");
  assert.equal(store.complete(first.id).status, "done");
  assert.deepEqual(
    store.list("all").map(({ title }) => title),
    ["First", "Second"],
  );
});

test("throws TaskNotFoundError for unknown IDs", () => {
  const store = createInMemoryTaskStore();

  assert.throws(() => store.getById(firstId), TaskNotFoundError);
  assert.throws(() => store.complete(firstId), TaskNotFoundError);
  assert.throws(() => store.remove(firstId), TaskNotFoundError);
});

test("removes existing tasks and rejects subsequent access", () => {
  const store = createInMemoryTaskStore(() => firstId);
  store.create("Disposable");

  store.remove(firstId);

  assert.deepEqual(store.list("all"), []);
  assert.throws(() => store.getById(firstId), TaskNotFoundError);
  assert.throws(() => store.remove(firstId), TaskNotFoundError);
});
