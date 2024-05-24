"use client";
import { createClient } from "@/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";

const supabase = createClient();
export default function Login() {
  return (
    <Auth
      supabaseClient={supabase}
      providers={["notion"]}
      redirectTo="https://voice-notes-gpt.vercel.app/auth/callback"
    />
  );
}
