import { z } from "zod";

export const taskStatusSchema = z.enum(["open", "done"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskFilterSchema = z.enum(["all", "open", "done"]);
export type TaskFilter = z.infer<typeof taskFilterSchema>;

export const taskTitleSchema = z.string().trim().min(1).max(200);

export const taskIdSchema = z.uuidv4();

export const createTaskInputSchema = z
  .object({
    title: taskTitleSchema,
  })
  .strict();
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const taskSchema = z.object({
  id: taskIdSchema,
  title: taskTitleSchema,
  status: taskStatusSchema,
});
export type Task = z.infer<typeof taskSchema>;
