import type { Task } from "../types/task";

export const initialTasks: Task[] = [
  {
    id: 1,
    title: "Verify Customer Documents",
    status: "PENDING",
  },
  {
    id: 2,
    title: "Review Identity Verification",
    status: "PENDING",
  },
  {
    id: 3,
    title: "Validate Address Proof",
    status: "IN_PROGRESS",
  },
  {
    id: 4,
    title: "Check Payment Details",
    status: "APPROVED",
  },
  {
    id: 5,
    title: "Review Submitted Application",
    status: "REJECTED",
  },
];