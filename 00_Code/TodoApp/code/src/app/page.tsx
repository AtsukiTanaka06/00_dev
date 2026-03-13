import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasks, signOut } from "@/actions/tasks";
import AddTaskForm from "@/components/AddTaskForm";
import TaskList from "@/components/TaskList";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tasks = await getTasks();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">タスク管理</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <AddTaskForm />
          <TaskList tasks={tasks ?? []} />
        </div>
      </main>
    </div>
  );
}
