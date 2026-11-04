import assert from "node:assert/strict";
import test from "node:test";
import {
  createTaskInputSchema,
  taskFilterSchema,
  taskIdSchema,
  taskSchema,
  taskTitleSchema,
} from "./task.js";
import { TaskNotFoundError } from "./errors.js";

test("trims a valid task title", () => {
  assert.equal(taskTitleSchema.parse("  Buy milk  "), "Buy milk");
});

test("rejects missing and whitespace-only titles", () => {
  assert.equal(taskTitleSchema.safeParse(undefined).success, false);
  assert.equal(taskTitleSchema.safeParse("   ").success, false);
});

test("accepts titles with 1 or 200 characters and rejects longer titles", () => {
  assert.equal(taskTitleSchema.safeParse("a").success, true);
  assert.equal(taskTitleSchema.safeParse("a".repeat(200)).success, true);
  assert.equal(taskTitleSchema.safeParse("a".repeat(201)).success, false);
});

test("requires creation input to contain only a title", () => {
  assert.deepEqual(createTaskInputSchema.parse({ title: "  Read  " }), {
    title: "Read",
  });
  assert.equal(
    createTaskInputSchema.safeParse({ title: "Read", status: "done" }).success,
    false,
  );
});

test("accepts only supported task list filters", () => {
  for (const filter of ["all", "open", "done"]) {
    assert.equal(taskFilterSchema.safeParse(filter).success, true);
  }
  assert.equal(taskFilterSchema.safeParse("pending").success, false);
});

test("requires UUID v4 task identifiers", () => {
  assert.equal(
    taskIdSchema.safeParse("0f8fad5b-d9cb-469f-a165-70867728950e").success,
    true,
  );
  assert.equal(
    taskIdSchema.safeParse("0f8fad5b-d9cb-169f-a165-70867728950e").success,
    false,
  );
});

test("validates the complete task shape", () => {
  assert.deepEqual(
    taskSchema.parse({
      id: "0f8fad5b-d9cb-469f-a165-70867728950e",
      title: "  Read  ",
      status: "open",
    }),
    {
      id: "0f8fad5b-d9cb-469f-a165-70867728950e",
      title: "Read",
      status: "open",
    },
  );
});

test("task not found error retains the requested ID", () => {
  const error = new TaskNotFoundError("missing-id");

  assert.equal(error.name, "TaskNotFoundError");
  assert.equal(error.taskId, "missing-id");
  assert.match(error.message, /missing-id/);
});
