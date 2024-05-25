import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meta = user?.user_metadata;
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        {/** Welcome user */}
        <div className="flex items-center">
          <h1 className="text-3xl font-semibold">Welcome {meta?.full_name}</h1>
        </div>
      </div>
    </main>
  );
}
