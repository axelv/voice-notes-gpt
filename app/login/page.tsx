"use client";
import { createClient } from "@/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";

const supabase = createClient();
export default function Login() {
  return (
    <main className="mx-auto max-w-screen-lg">
      <Auth
        appearance={{ theme: ThemeSupa }}
        supabaseClient={supabase}
        providers={["notion"]}
        redirectTo="https://voice-notes-gpt.vercel.app/auth/callback"
      />
    </main>
  );
}
