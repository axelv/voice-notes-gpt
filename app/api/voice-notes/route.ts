import { markdownToBlocks, markdownToRichText } from "@tryfabric/martian";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// id must be formatted with hypens: 8-4-4-4-12
const VOICE_NOTES_DATABASE_ID = "cdc513fe-3355-4860-8426-5f7945c3a670";

const CreateVoiceNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
});
export async function GET() {
  return NextResponse.json({
    message:
      "Welcome to the voice notes API. Use POST to create a new voice note.",
  });
}

export async function POST(request: NextRequest) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 },
    );
  }
  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = CreateVoiceNoteSchema.parse(await request.json());
  const bearer = authorization.split(" ")[1];
  const blocks = markdownToBlocks(data.content);
  const notion = new Client({ auth: bearer });
  const page_response = await notion.pages.create({
    parent: {
      database_id: VOICE_NOTES_DATABASE_ID,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
    },
    children: blocks as BlockObjectRequest[],
  });
  return NextResponse.json(
    {
      voice_note_id: page_response.id,
      message:
        "Successfully created new voice note with id: " + page_response.id,
    },
    { status: 201 },
  );
}
