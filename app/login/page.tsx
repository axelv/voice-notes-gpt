"use client";
import { createClient } from "@/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";
import Image from "next/image";

const supabase = createClient();
export default function Login() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Image
          alt="Voice Notes"
          src="/logo.png"
          height="150"
          width="150"
          className="block rounded-md shadow-md mx-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to Voice Notes
        </h2>
      </div>
      <main className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Auth
          theme="light"
          view="sign_in"
          onlyThirdPartyProviders={true}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "white",
                  brandAccent: "orange",
                },
              },
            },
          }}
          supabaseClient={supabase}
          providers={["notion"]}
          redirectTo="https://voice-notes-gpt.vercel.app/auth/callback"
        />
      </main>
    </div>
  );
}
