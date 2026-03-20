import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../auth/supabase";
import { saveKey, loadKey, deleteKey } from "../utils/secureStorage";

const SESSION_KEY = "supabase_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30日

interface StoredSession {
  access_token: string;
  refresh_token: string;
  saved_at: number;
}

async function saveSession(session: Session): Promise<void> {
  const data: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    saved_at: Date.now(),
  };
  await saveKey(SESSION_KEY, JSON.stringify(data));
}

async function restoreSession(): Promise<Session | null> {
  try {
    const raw = await loadKey(SESSION_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as StoredSession;

    // 30日超過なら破棄
    if (Date.now() - data.saved_at > SESSION_TTL_MS) {
      await deleteKey(SESSION_KEY);
      return null;
    }

    const { data: refreshed, error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (error || !refreshed.session) {
      await deleteKey(SESSION_KEY);
      return null;
    }

    // 新しいトークンで上書き保存
    await saveSession(refreshed.session);
    return refreshed.session;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    // まず Supabase の localStorage セッションを確認
    const { data } = await supabase.auth.getSession();
    let session = data.session;

    // なければ tauri-plugin-store から復元
    if (!session) {
      session = await restoreSession();
    }

    set({ user: session?.user ?? null, session, loading: false });

    // 以降のログイン・リフレッシュをストアに反映
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      set({ user: newSession?.user ?? null, session: newSession });
      if (newSession) {
        await saveSession(newSession);
      } else {
        await deleteKey(SESSION_KEY);
      }
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) await saveSession(data.session);
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await deleteKey(SESSION_KEY);
    set({ user: null, session: null });
  },
}));
