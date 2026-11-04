import { randomUUID } from "node:crypto";
import { TaskNotFoundError } from "../domain/errors.js";
import type { Task, TaskFilter } from "../domain/task.js";

export interface TaskStore {
  create(title: string): Task;
  list(filter: TaskFilter): Task;
  getById(id: string): Task;
  complete(id: string): Task;
  remove(id: string): void;
}

export function createInMemoryTaskStore(
  generateId: () => string = randomUUID,
): TaskStore {
  const tasks = new Map<string, Task>();

  function getStoredTask(id: string): Task {
    const task = tasks.get(id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    return task;
  }

  function copyTask(task: Task): Task {
    return { ...task };
  }

  return {
    create(title) {
      const id = generateId();
      if (tasks.has(id)) {
        throw new Error(`Generated task ID already exists: ${id}`);
      }

      const task: Task = { id, title, status: "open" };
      tasks.set(id, task);
      return copyTask(task);
    },

    list(filter) {
      return [...tasks.values()]
        .filter((task) => filter === "all" || task.status === filter)
        .map(copyTask);
    },

    getById(id) {
      return copyTask(getStoredTask(id));
    },

    complete(id) {
      const task = getStoredTask(id);
      if (task.status !== "done") {
        task.status = "done";
      }

      return copyTask(task);
    },

    remove(id) {
      getStoredTask(id);
      tasks.delete(id);
    },
  };
}
