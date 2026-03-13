"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getTasks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addTask(title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .insert({ title, user_id: user.id });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function toggleTask(id: string, isCompleted: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ is_completed: !isCompleted })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}
