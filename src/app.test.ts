import assert from "node:assert/strict";
import test from "node:test";
import { createApplication } from "./app.js";
import { createInMemoryTaskStore } from "./store/task-store.js";

const taskId = "0f8fad5b-d9cb-469f-a165-70867728950e";

test("composes one service over the provided store", () => {
  const taskStore = createInMemoryTaskStore(() => taskId);
  const application = createApplication(taskStore);

  const task = application.taskService.create("Shared task");

  assert.equal(application.taskStore, taskStore);
  assert.deepEqual(application.taskStore.getById(task.id), task);
  assert.deepEqual(application.taskService.list(), [task]);
});

test("creates an in-memory store when one is not provided", () => {
  const application = createApplication();
  const task = application.taskService.create("Default task");

  assert.deepEqual(application.taskStore.getById(task.id), task);
});
