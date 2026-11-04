export class TaskNotFoundError extends Error {
  constructor(readonly taskId: string) {
    super(`Task not found: ${taskId}`);
    this.name = "TaskNotFoundError";
  }
}
