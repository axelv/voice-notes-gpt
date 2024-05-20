import { markdownToBlocks, markdownToRichText } from "@tryfabric/martian";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

// id must be formatted with hypens: 8-4-4-4-12
const VOICE_NOTES_DATABASE_ID = "cdc513fe-3355-4860-8426-5f7945c3a670";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const data = req.body as { title: string; content: string };
  const bearer = authorization.split(" ")[1];
  const blocks = markdownToBlocks(data.content);
  const notion = new Client({ auth: bearer });
  await notion.pages.create({
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
  return res.json({
    message: "Success!",
  });
}
