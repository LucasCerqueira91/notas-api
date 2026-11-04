import { createTaskService } from "./service/task-service.js";
import type { TaskService } from "./service/task-service.js";
import { createInMemoryTaskStore } from "./store/task-store.js";
import type { TaskStore } from "./store/task-store.js";

export interface Application {
  taskStore: TaskStore;
  taskService: TaskService;
}

export function createApplication(
  taskStore: TaskStore = createInMemoryTaskStore(),
): Application {
  return {
    taskStore,
    taskService: createTaskService(taskStore),
  };
}
