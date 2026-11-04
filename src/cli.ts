import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { ZodError, z } from "zod";
import { createApplication } from "./app.js";
import { TaskNotFoundError } from "./domain/errors.js";
import {
  taskFilterSchema,
  taskIdSchema,
  taskTitleSchema,
} from "./domain/task.js";
import type { Task } from "./domain/task.js";
import type { TaskService } from "./service/task-service.js";

const commandSchema = z.enum(["create", "list", "complete", "remove"]);
const createArgumentsSchema = z.tuple([taskTitleSchema]);
const listArgumentsSchema = z.union([
  z.tuple([]),
  z.tuple([z.literal("--filter"), taskFilterSchema]),
]);
const taskIdArgumentsSchema = z.tuple([taskIdSchema]);

export interface CliOutput {
  stdout(message: string): void;
  stderr(message: string): void;
}

const processOutput: CliOutput = {
  stdout: (message) => process.stdout.write(message),
  stderr: (message) => process.stderr.write(message),
};

function formatTask(task: Task): string {
  return `${task.id} | ${task.status} | ${task.title}`;
}

export function runTaskCli(
  args: readonly string[],
  service: TaskService,
  output: CliOutput = processOutput,
): number {
  try {
    const [command, ...commandArguments] = args;

    switch (commandSchema.parse(command)) {
      case "create": {
        const [title] = createArgumentsSchema.parse(commandArguments);
        const task = service.create(title);
        output.stdout(`Created task:\n${formatTask(task)}\n`);
        return 0;
      }

      case "list": {
        const parsedArguments = listArgumentsSchema.parse(commandArguments);
        const filter = parsedArguments[0] === "--filter"
          ? parsedArguments[1]
          : "all";
        const tasks = service.list(filter);
        output.stdout(
          tasks.length === 0
            ? "No tasks found.\n"
            : `${tasks.map(formatTask).join("\n")}\n`,
        );
        return 0;
      }

      case "complete": {
        const [id] = taskIdArgumentsSchema.parse(commandArguments);
        const task = service.complete(id);
        output.stdout(`Completed task:\n${formatTask(task)}\n`);
        return 0;
      }

      case "remove": {
        const [id] = taskIdArgumentsSchema.parse(commandArguments);
        service.remove(id);
        output.stdout(`Removed task ${id}.\n`);
        return 0;
      }
    }

  } catch (error) {
    if (error instanceof ZodError) {
      output.stderr(
        `Error: ${error.issues.map(({ message }) => message).join("; ")}\n`,
      );
      return 1;
    }

    if (error instanceof TaskNotFoundError) {
      output.stderr(`Error: ${error.message}\n`);
      return 1;
    }

    throw error;
  }
}

export function runCli(
  args: readonly string[],
  output: CliOutput = processOutput,
): number {
  const application = createApplication();
  return runTaskCli(args, application.taskService, output);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  process.exitCode = runCli(process.argv.slice(2));
}
