export type TaskStatus = "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
}