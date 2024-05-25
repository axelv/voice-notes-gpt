import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.redirect("/login");
}
export async function POST() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.redirect("/login");
}
