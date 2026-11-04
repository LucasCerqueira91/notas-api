import { taskTitleSchema } from "../domain/task.js";
import type { Task, TaskFilter } from "../domain/task.js";
import type { TaskStore } from "../store/task-store.js";

export interface TaskService {
  create(title: string): Task;
  list(filter?: TaskFilter): Task[];
  complete(id: string): Task;
  remove(id: string): void;
}

export function createTaskService(store: TaskStore): TaskService {
  return {
    create(title) {
      return store.create(taskTitleSchema.parse(title));
    },

    list(filter = "all") {
      return store.list(filter);
    },

    complete(id) {
      return store.complete(id);
    },

    remove(id) {
      store.remove(id);
    },
  };
}
