"use client";

import { useTransition } from "react";
import { toggleTask, deleteTask } from "@/actions/tasks";

type Task = {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
};

export default function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(() => toggleTask(task.id, task.is_completed));
  };

  const handleDelete = () => {
    startTransition(() => deleteTask(task.id));
  };

  return (
    <li
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isPending ? "opacity-50" : ""
      } ${task.is_completed ? "bg-gray-50" : "bg-white"}`}
    >
      <input
        type="checkbox"
        checked={task.is_completed}
        onChange={handleToggle}
        disabled={isPending}
        className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
      />
      <span
        className={`flex-1 text-sm ${
          task.is_completed ? "line-through text-gray-400" : "text-gray-800"
        }`}
      >
        {task.title}
      </span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-gray-400 hover:text-red-500 disabled:cursor-not-allowed transition-colors text-sm"
        aria-label="タスクを削除"
      >
        ✕
      </button>
    </li>
  );
}
