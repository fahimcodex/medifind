import {
  isAuthSessionMissingError,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error && !isAuthSessionMissingError(error)) {
      throw error;
    }

    return data.user;
  } catch (error) {
    if (isAuthSessionMissingError(error)) {
      return null;
    }
    throw error;
  }
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
