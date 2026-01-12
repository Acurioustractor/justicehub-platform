import { NextRequest, NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';
import path from 'node:path';
import { ensureOpenAIEmbeddingFunction, OpenAIEmbeddingFunction } from '@/lib/chroma/openai-embedding';

const CHROMA_DIR = process.env.CHROMA_DIR || path.join(process.cwd(), 'data', 'chroma');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = Math.min(20, parseInt(searchParams.get('limit') || '8', 10));

  if (!query) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 });
  }
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  try {
    ensureOpenAIEmbeddingFunction();
    const client = new ChromaClient({ path: 'file:' + CHROMA_DIR });
    const embedder = new OpenAIEmbeddingFunction({
      apiKeyEnvVar: 'OPENAI_API_KEY',
      modelName: 'text-embedding-3-small',
    });
    const collection = await client.getOrCreateCollection({ name: 'clearinghouse', embeddingFunction: embedder });

    const results = await collection.query({ queryTexts: [query], nResults: limit });

    const data = (results.documents?.[0] || []).map((doc, idx) => ({
      chunk: doc,
      metadata: results.metadatas?.[0]?.[idx] || {},
      score: results.distances?.[0]?.[idx],
    }));

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Search error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
