import { fetch } from "@tauri-apps/plugin-http";
import type { PipelineResult } from "../types/pipeline";
import { useSettingsStore } from "../store/settingsStore";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

/** Notion DB の一覧を取得 */
export async function searchDatabases(apiKey: string): Promise<{ id: string; title: string }[]> {
  const res = await fetch(`${NOTION_API}/search`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ filter: { value: "database", property: "object" } }),
  });
  if (!res.ok) throw new Error(`Notion API エラー: ${res.status}`);
  const data = (await res.json()) as {
    results: { id: string; title: { plain_text: string }[] }[];
  };
  return data.results.map((db) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text ?? "無題のデータベース",
  }));
}

/** DBに「生成日」プロパティがなければ追加する */
async function ensureDateProperty(apiKey: string, databaseId: string): Promise<void> {
  const res = await fetch(`${NOTION_API}/databases/${databaseId}`, {
    method: "GET",
    headers: headers(apiKey),
  });
  if (!res.ok) return;
  const db = (await res.json()) as { properties: Record<string, { type: string }> };
  if (db.properties["生成日"]) return;

  await fetch(`${NOTION_API}/databases/${databaseId}`, {
    method: "PATCH",
    headers: headers(apiKey),
    body: JSON.stringify({
      properties: {
        生成日: { date: {} },
      },
    }),
  });
}

/** Markdown テキストを Notion ブロックに変換 */
function markdownToBlocks(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 100)
    .map((line) => {
      if (line.startsWith("## ")) {
        return {
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3) } }] },
        };
      }
      if (line.startsWith("### ")) {
        return {
          type: "heading_3",
          heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4) } }] },
        };
      }
      if (line.startsWith("# ")) {
        return {
          type: "heading_1",
          heading_1: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] },
        };
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return {
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] },
        };
      }
      return {
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: line } }] },
      };
    });
}

/** DB に親レコードを作成して page_id と url を返す */
async function createParentPage(
  apiKey: string,
  databaseId: string,
  title: string,
  date: string
): Promise<{ id: string; url: string }> {
  const res = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        title: { title: [{ type: "text", text: { content: title } }] },
        生成日: { date: { start: date } },
      },
    }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? `親ページ作成エラー: ${res.status}`);
  }
  const page = (await res.json()) as { id: string; url: string };
  return { id: page.id, url: page.url };
}

/** 親ページの子として子ページを作成して url を返す */
async function createChildPage(
  apiKey: string,
  parentPageId: string,
  title: string,
  content: string
): Promise<string> {
  const blocks = markdownToBlocks(content);
  const res = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      properties: {
        title: { title: [{ type: "text", text: { content: title } }] },
      },
      children: blocks,
    }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(err.message ?? `子ページ作成エラー: ${res.status}`);
  }
  const page = (await res.json()) as { url: string };
  return page.url;
}

export interface SaveToNotionResult {
  parent: string;
  research: string;
  requirements: string;
  strategy: string;
  contents: string;
  script: string;
}

/** パイプライン結果を Notion に保存（親1件 + 子5件） */
export async function saveToNotion(
  databaseId: string,
  result: PipelineResult,
  baseTitle: string
): Promise<SaveToNotionResult> {
  const { notionApiKey } = useSettingsStore.getState();
  if (!notionApiKey) throw new Error("Notion APIキーが設定されていません");

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 「生成日」プロパティがなければ追加
  await ensureDateProperty(notionApiKey, databaseId);

  // DB に親レコードを1件作成
  const parent = await createParentPage(notionApiKey, databaseId, baseTitle, today);

  // 親ページ配下に子ページを5件作成
  const [research, requirements, strategy, contents, script] = await Promise.all([
    createChildPage(notionApiKey, parent.id, "リサーチ", result.research),
    createChildPage(notionApiKey, parent.id, "要件定義", result.requirements),
    createChildPage(notionApiKey, parent.id, "戦略", result.strategy),
    createChildPage(notionApiKey, parent.id, "コンテンツ", result.contents),
    createChildPage(notionApiKey, parent.id, "スクリプト", result.script),
  ]);

  return { parent: parent.url, research, requirements, strategy, contents, script };
}
