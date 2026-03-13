import TaskItem from "./TaskItem";

type Task = {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
};

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8">
        タスクがありません。追加してみましょう！
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
