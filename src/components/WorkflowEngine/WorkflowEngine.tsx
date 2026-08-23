import { useEffect, useRef, useState } from "react";
import { initialTasks } from "../../data/tasks";
import type { Task, TaskStatus } from "../../types/task";
import "./WorkflowEngine.css";

const WorkflowEngine = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [connectionStatus, setConnectionStatus] = useState("CONNECTING");

  const wsRef = useRef<WebSocket | null>(null);
  const retryDelayRef = useRef(1000);
  const retryTimeoutRef = useRef<number | null>(null);

  const pendingTasks = tasks.filter((task) => task.status === "PENDING");

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "APPROVED" || task.status === "REJECTED"
  );

  const handleStatusUpdate = (taskId: number, newStatus: TaskStatus) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      type: "STATUS_UPDATE",
      taskId,
      newStatus,
    };

    wsRef.current.send(JSON.stringify(payload));
  };

  useEffect(() => {
    let isUnmounted = false;

    const connectWebSocket = () => {
      setConnectionStatus("CONNECTING");

      const ws = new WebSocket("wss://ws.postman-echo.com/raw");
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("OPEN");
        retryDelayRef.current = 1000;
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        console.log(message);

        if (message.type === "STATUS_UPDATE") {
          setTasks((previousTasks) =>
            previousTasks.map((task) =>
              task.id === message.taskId
                ? { ...task, status: message.newStatus }
                : task
            )
          );

          console.log("[Analytics] Task status mutated via WebSocket");
        }
      };

      ws.onclose = () => {
        setConnectionStatus("CLOSED");

        if (isUnmounted) {
          return;
        }

        const delay = retryDelayRef.current;

        retryTimeoutRef.current = window.setTimeout(() => {
          retryDelayRef.current *= 2;
          connectWebSocket();
        }, delay);
      };
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;

      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }

      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const isOffline = connectionStatus !== "OPEN";
  const offlineTitle = isOffline ? "Offline - Reconnecting..." : undefined;

  return (
    <main className="workflow-container">
      <header className="workflow-header">
        <h1>Real-Time Operations Workflow</h1>

        <p className="connection-status">
          Connection: {connectionStatus}
        </p>
      </header>

      <div className="kanban-board">
        <section className="pending-column">
          <h2>PENDING</h2>
          <p>Pending Tasks: {pendingTasks.length}</p>

          {pendingTasks.length === 0 && inProgressTasks.length === 0 && (
            <div className="empty-state">
              <h2> All caught up!</h2>
              <p>No pending work remaining.</p>
            </div>
          )}

          <div>
            {pendingTasks.map((task) => (
              <article key={task.id}>
                <h3>{task.title}</h3>
                <p>Status: {task.status}</p>

                <button
                  type="button"
                  className="action-button approve-button"
                  aria-label={`Approve ${task.title}`}
                  disabled={isOffline}
                  title={offlineTitle}
                  onClick={() => handleStatusUpdate(task.id, "APPROVED")}
                >
                  Approve
                </button>

                <button
                  type="button"
                  className="action-button reject-button"
                  aria-label={`Reject ${task.title}`}
                  disabled={isOffline}
                  title={offlineTitle}
                  onClick={() => handleStatusUpdate(task.id, "REJECTED")}
                >
                  Reject
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="in-progress-column">
          <h2>IN PROGRESS</h2>
          <p>In Progress Tasks: {inProgressTasks.length}</p>

          <div>
            {inProgressTasks.map((task) => (
              <article key={task.id}>
                <h3>{task.title}</h3>
                <p>Status: {task.status}</p>

                <button
                  type="button"
                  className="action-button complete-button"
                  aria-label={`Complete ${task.title}`}
                  disabled={isOffline}
                  title={offlineTitle}
                  onClick={() => handleStatusUpdate(task.id, "APPROVED")}
                >
                  Complete
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="completed-column">
          <h2>COMPLETED</h2>
          <p>Completed Tasks: {completedTasks.length}</p>

          <div>
            {completedTasks.map((task) => (
              <article key={task.id}>
                <h3>{task.title}</h3>
                <p>Status: {task.status}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default WorkflowEngine;