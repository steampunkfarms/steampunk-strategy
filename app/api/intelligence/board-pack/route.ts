export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gatherBoardPackData, generateBoardPackHTML, type BoardPackOptions } from '@/lib/intelligence/board-pack';

/**
 * POST /api/intelligence/board-pack
 *
 * Generate and download a board/grant report as HTML (print-to-PDF).
 * Body: BoardPackOptions
 * see docs/handoffs/_working/20260307-bi-strategic-layer3-working-spec.md
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as BoardPackOptions;

  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return NextResponse.json({ error: 'At least one section must be selected' }, { status: 400 });
  }

  const data = await gatherBoardPackData(body);
  const html = generateBoardPackHTML(data);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="board-pack-${new Date().toISOString().slice(0, 10)}.html"`,
    },
  });
}
