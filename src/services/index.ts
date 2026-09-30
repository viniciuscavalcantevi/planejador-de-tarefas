import { isSupabaseConfigured } from "./supabaseClient";
import { DemoRepository } from "./demoRepository";
import { SupabaseRepository } from "./supabaseRepository";
import type { TaskRepository } from "./repository";

export const repository: TaskRepository = isSupabaseConfigured
  ? new SupabaseRepository()
  : new DemoRepository();

export const isDemoMode = repository.mode === "demo";

export * from "./repository";
