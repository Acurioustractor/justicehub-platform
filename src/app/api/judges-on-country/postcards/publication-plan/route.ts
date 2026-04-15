import { NextRequest, NextResponse } from 'next/server';
import {
  buildJudgesPostcardPublicationMarkdown,
  buildJudgesPostcardPublicationQueue,
} from '@/lib/judges-postcard-publication-plan';

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format');

    if (format === 'markdown') {
      const markdown = await buildJudgesPostcardPublicationMarkdown();
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }

    const queue = await buildJudgesPostcardPublicationQueue();

    return NextResponse.json({
      success: true,
      ...queue,
    });
  } catch (error) {
    console.error('Judges postcard publication plan error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build publication plan',
      },
      { status: 500 }
    );
  }
}
