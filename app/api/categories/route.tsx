// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { categories, attributeTemplates, subcategories } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const attributeSchema = z.object({
    name: z.string().nullable(),
    type: z.enum(['text', 'number', 'boolean', 'select']).nullable(),
    options: z.array(z.string()).nullable().optional(),
    unit: z.string().nullable().optional(),
    isFilterable: z.boolean().nullable(),
    isRequired: z.boolean().nullable(),
    displayOrder: z.number().int().nullable(),
});

const createCategorySchema = z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    imageUrl: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
    attributes: z.array(attributeSchema).default([]),
    subcategoryNames: z.array(z.string()).default([]),
  });
  
  const patchCategorySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    imageUrl: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
    attributes: z.array(attributeSchema).default([]),
    subcategoryNames: z.array(z.string()).default([]),
  });

type CategoryResponse = Record<
    string,
    {
        category: {
            id: string;
            name: string;
            slug: string;
            description?: string | null;
            isActive: boolean;
            displayOrder: string;
        };
        attributes: Array<{
            name: string | null;
            type: 'text' | 'number' | 'boolean' | 'select' | null;
            options?: string[] | null;
            unit?: string | null;
            isFilterable: boolean | null;
            isRequired: boolean | null;
            displayOrder: number | null;
        }>;
        subcategories: Array<{ id: string; name: string; slug: string }>;
    }
>;

export async function GET() {
    try {
        const allCategories = await db
            .select({
                category: categories,
                attributes: attributeTemplates.attributes,
                subcategory: subcategories,
            })
            .from(categories)
            .leftJoin(attributeTemplates, eq(categories.id, attributeTemplates.categoryId))
            .leftJoin(subcategories, eq(categories.id, subcategories.categoryId));

        const groupedPresets: CategoryResponse = allCategories.reduce((acc, row) => {
            const categorySlug = row.category.slug;
            if (!acc[categorySlug]) {
                const attributes = Array.isArray(row.attributes)
                    ? row.attributes.filter((attr: any) => attributeSchema.safeParse(attr).success)
                    : [];
                acc[categorySlug] = {
                    category: {
                        id: row.category.id,
                        name: row.category.name,
                        slug: row.category.slug,
                        description: row.category.description,
                        isActive: row.category.isActive,
                        displayOrder: row.category.displayOrder,
                    },
                    attributes,
                    subcategories: [],
                };
            }
            if (row.subcategory) {
                acc[categorySlug].subcategories.push({
                    id: row.subcategory.id,
                    name: row.subcategory.name,
                    slug: row.subcategory.slug,
                });
            }
            return acc;
        }, {} as CategoryResponse);

        return NextResponse.json(groupedPresets);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('PATCH request body:', body);

        const validatedData = patchCategorySchema.parse(body);
        const {
            id,
            name,
            slug,
            description,
            imageUrl,
            isActive,
            displayOrder,
            attributes,
            subcategoryNames, // Changed from subcategories
        } = validatedData;

        // Check if slug is unique (excluding the current category)
        const existingCategory = await db
            .select()
            .from(categories)
            .where(and(eq(categories.slug, slug), sql`${categories.id} != ${id}`))
            .limit(1);
        if (existingCategory.length > 0) {
            return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 });
        }

        // Update category
        const [updatedCategory] = await db
            .update(categories)
            .set({
                name,
                slug,
                description: description || null,
                imageUrl: imageUrl || null,
                isActive: isActive ?? true,
                displayOrder: displayOrder.toString(),
                updatedAt: new Date(),
            })
            .where(eq(categories.id, id))
            .returning();

        if (!updatedCategory) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Update or insert attribute template
        await db.delete(attributeTemplates).where(eq(attributeTemplates.categoryId, id));
        if (attributes.length > 0) {
            await db.insert(attributeTemplates).values({
                categoryId: id,
                name: `${name} Attributes`,
                attributes,
            });
        }

        // Update subcategories (delete existing and insert new)
        await db.delete(subcategories).where(eq(subcategories.categoryId, id));
        if (subcategoryNames.length > 0) {
          const subcategoryValues = subcategoryNames.map((name: string, index: number) => ({
            categoryId: id,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            displayOrder: index.toString(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          console.log('Subcategory values:', subcategoryValues);
          console.log('Insert SQL:', db.insert(subcategories).values(subcategoryValues).toSQL());
          await db.insert(subcategories).values(subcategoryValues);
        }

        return NextResponse.json({ category: updatedCategory }, { status: 200 });
    } catch (error) {
        console.error('Error updating category:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: `Failed to update category: ${(error as Error).message}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedData = createCategorySchema.parse(body);

        // Check if slug already exists
        const existingCategory = await db
            .select()
            .from(categories)
            .where(eq(categories.slug, validatedData.slug))
            .limit(1);
        if (existingCategory.length > 0) {
            return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 });
        }

        // Insert category
        const [newCategory] = await db
            .insert(categories)
            .values({
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                imageUrl: validatedData.imageUrl,
                isActive: validatedData.isActive,
                displayOrder: validatedData.displayOrder.toString(),
            })
            .returning();

        // Insert attribute template
        if (validatedData.attributes.length > 0) {
            await db.insert(attributeTemplates).values({
                categoryId: newCategory.id,
                name: `${validatedData.name} Attributes`,
                attributes: validatedData.attributes,
            });
        }

        // Insert subcategories
        if (validatedData.subcategoryNames.length > 0) {
            const subcategoryValues = validatedData.subcategoryNames.map((name, index) => ({
              categoryId: newCategory.id,
              name,
              slug: name.toLowerCase().replace(/\s+/g, '-'),
              displayOrder: index.toString(),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
            await db.insert(subcategories).values(subcategoryValues);
          }

        return NextResponse.json({ category: newCategory }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}