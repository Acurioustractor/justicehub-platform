import { NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';
import path from 'node:path';
import OpenAI from 'openai';
import { ensureOpenAIEmbeddingFunction, OpenAIEmbeddingFunction } from '@/lib/chroma/openai-embedding';

const CHROMA_DIR = process.env.CHROMA_DIR || path.join(process.cwd(), 'data', 'chroma');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
You are JusticeHub's clearinghouse research assistant.
- Answer concisely using only the provided context.
- Always cite source_system/title (and url if present) for each fact.
- If unsure, say you don't know and suggest searching the admin view.
- Do not invent facts or legal outcomes.
`;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  let body: { question?: string; limit?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const question = (body.question || '').trim();
  const limit = Math.min(10, Math.max(3, body.limit || 6));

  if (!question) {
    return NextResponse.json({ error: 'Missing question' }, { status: 400 });
  }

  try {
    ensureOpenAIEmbeddingFunction();
    const client = new ChromaClient({ path: 'file:' + CHROMA_DIR });
    const embedder = new OpenAIEmbeddingFunction({
      apiKeyEnvVar: 'OPENAI_API_KEY',
      modelName: 'text-embedding-3-small',
    });
    const collection = await client.getOrCreateCollection({
      name: 'clearinghouse',
      embeddingFunction: embedder,
    });

    const results = await collection.query({
      queryTexts: [question],
      nResults: limit,
    });

    const contexts = (results.documents?.[0] || []).map((chunk, idx) => {
      const meta = results.metadatas?.[0]?.[idx] || {};
      const title = meta.title || 'Untitled';
      const source = meta.source_system || 'unknown-source';
      const url = meta.url || '';
      return `Title: ${title}\nSource: ${source}${url ? `\nURL: ${url}` : ''}\nChunk: ${chunk}`;
    });

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: ${question}\n\nContext:\n${contexts.join('\n\n---\n\n')}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const answer = completion.choices[0]?.message?.content || 'No answer generated.';
    return NextResponse.json({
      success: true,
      answer,
      used: contexts.length,
    });
  } catch (err: any) {
    console.error('Chat error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
