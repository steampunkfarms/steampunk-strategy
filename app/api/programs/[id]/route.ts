// postest
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH /api/programs/[id] — update a program's editable fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const body = await request.json();
  const { name, description, species, functionalClass, icon, color } = body as {
    name?: string;
    description?: string | null;
    species?: string[];
    functionalClass?: string;
    icon?: string | null;
    color?: string | null;
  };

  // Build update data — only include fields that were provided
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (species !== undefined) data.species = JSON.stringify(species);
  if (functionalClass !== undefined) data.functionalClass = functionalClass;
  if (icon !== undefined) data.icon = icon;
  if (color !== undefined) data.color = color;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await prisma.program.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
