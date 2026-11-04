import assert from "node:assert/strict";
import test from "node:test";
import { createApplication } from "./app.js";
import { createInMemoryTaskStore } from "./store/task-store.js";
import { runTaskCli } from "./cli.js";
import type { CliOutput } from "./cli.js";

const taskIds = [
  "0f8fad5b-d9cb-469f-a165-70867728950e",
  "0f8fad5b-d9cb-469f-a165-70867728951e",
];
const missingTaskId = "0f8fad5b-d9cb-469f-a165-70867728959e";

function createCliHarness() {
  const ids = [...taskIds];
  const application = createApplication(
    createInMemoryTaskStore(() => {
      const id = ids.shift();
      if (!id) {
        throw new Error("Test task ID sequence exhausted");
      }

      return id;
    }),
  );
  const stdout: string[] = [];
  const stderr: string[] = [];
  const output: CliOutput = {
    stdout: (message) => stdout.push(message),
    stderr: (message) => stderr.push(message),
  };

  return {
    application,
    stdout,
    stderr,
    run: (args: readonly string[]) =>
      runTaskCli(args, application.taskService, output),
  };
}

test("supports creating, listing, completing, and removing tasks", () => {
  const cli = createCliHarness();
  const firstTask = {
    id: taskIds[0],
    title: "First task",
    status: "open",
  };

  assert.equal(cli.run(["create", "  First task  "]), 0);
  assert.equal(
    cli.stdout.pop(),
    `Created task:\n${firstTask.id} | open | First task\n`,
  );

  assert.equal(cli.run(["create", "Second task"]), 0);
  cli.stdout.pop();
  assert.equal(cli.run(["list"]), 0);
  assert.equal(
    cli.stdout.pop(),
    `${firstTask.id} | open | First task\n${taskIds[1]} | open | Second task\n`,
  );

  assert.equal(cli.run(["complete", firstTask.id]), 0);
  assert.equal(
    cli.stdout.pop(),
    `Completed task:\n${firstTask.id} | done | First task\n`,
  );
  assert.equal(cli.run(["list", "--filter", "done"]), 0);
  assert.equal(
    cli.stdout.pop(),
    `${firstTask.id} | done | First task\n`,
  );
  assert.equal(cli.run(["list", "--filter", "open"]), 0);
  assert.equal(
    cli.stdout.pop(),
    `${taskIds[1]} | open | Second task\n`,
  );

  assert.equal(cli.run(["remove", taskIds[1]]), 0);
  assert.equal(cli.stdout.pop(), `Removed task ${taskIds[1]}.\n`);
  assert.deepEqual(cli.stderr, []);
});

test("lists no tasks with a clear success message", () => {
  const cli = createCliHarness();

  assert.equal(cli.run(["list"]), 0);
  assert.equal(cli.stdout.pop(), "No tasks found.\n");
  assert.deepEqual(cli.stderr, []);
});

test("rejects malformed commands and arguments without success output", () => {
  const invalidArguments = [
    [],
    ["unknown"],
    ["create"],
    ["create", " "],
    ["create", "Title", "extra"],
    ["list", "--filter", "pending"],
    ["list", "--filter", "open", "--filter", "done"],
    ["complete"],
    ["complete", "not-a-uuid"],
    ["remove", "not-a-uuid"],
  ];

  for (const args of invalidArguments) {
    const cli = createCliHarness();

    assert.equal(cli.run(args), 1, `expected failure for: ${args.join(" ")}`);
    assert.deepEqual(cli.stdout, []);
    assert.equal(cli.stderr.length, 1);
    assert.match(cli.stderr[0], /^Error: .+\n$/);
    assert.deepEqual(cli.application.taskService.list(), []);
  }
});

test("reports missing tasks to stderr and returns failure", () => {
  for (const args of [
    ["complete", missingTaskId],
    ["remove", missingTaskId],
  ]) {
    const cli = createCliHarness();

    assert.equal(cli.run(args), 1);
    assert.deepEqual(cli.stdout, []);
    assert.equal(cli.stderr.length, 1);
    assert.match(cli.stderr[0], /Task not found/);
  }
});
