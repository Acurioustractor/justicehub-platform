import { Client } from "@notionhq/client";
import type {
  CreatePageParameters,
  CreatePageResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { env } from "./env";

let notionClient: Client | null = null;

export function getNotionClient(): Client {
  if (!env.notionToken) {
    throw new Error("Notion API token missing. Set NOTION_API_TOKEN in your environment.");
  }

  if (!notionClient) {
    notionClient = new Client({ auth: env.notionToken });
  }

  return notionClient;
}

export async function createNotionPage(
  databaseId: string,
  properties: CreatePageParameters["properties"],
): Promise<CreatePageResponse> {
  const notion = getNotionClient();
  return notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
}
