import { NextRequest, NextResponse } from 'next/server';
import { brands } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';

type Params = { id: string };

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> } 
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    const updatedBrand = await db
      .update(brands)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();

    if (updatedBrand.length === 0) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBrand[0]);
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> } // Adjust type to expect a Promise
) {
  try {
    const { id } = await context.params; // Await the params
    const deletedBrand = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning();

    if (deletedBrand.length === 0) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Brand deleted' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}