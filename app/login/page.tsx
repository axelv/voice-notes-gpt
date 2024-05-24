"use client";
import { createClient } from "@/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";

export default function Login() {
  const supabase = createClient();

  return <Auth supabaseClient={supabase} providers={["notion"]} />;
}
