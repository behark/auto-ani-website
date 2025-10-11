import { NextRequest, NextResponse } from 'next/server';
import { queryDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get('published') === 'true';
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    let whereClause = 'TRUE';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (published) {
      whereClause += ` AND "isPublished" = true`;
    }

    if (category) {
      whereClause += ` AND LOWER(category) = LOWER($${paramIndex})`;
      queryParams.push(category);
      paramIndex++;
    }

    if (tag) {
      whereClause += ` AND tags ILIKE $${paramIndex}`;
      queryParams.push(`%"${tag}"%`);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const query = `
      SELECT
        id, title, slug, excerpt, "featuredImage", author, category, tags,
        "isPublished", "publishedAt", views, "seoTitle", "seoDescription",
        "createdAt", "updatedAt"
      FROM blog_posts
      WHERE ${whereClause}
      ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);

    const posts = await queryDatabase(query, queryParams);

    // Parse JSON fields
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      images: post.images ? JSON.parse(post.images) : [],
      estimatedReadTime: Math.max(1, Math.ceil((post.content?.length || 0) / 200)) // ~200 words per minute
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      total: posts.length
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      posts: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      images = [],
      author,
      category,
      tags = [],
      isPublished = false,
      seoTitle,
      seoDescription
    } = body;

    // Validation
    if (!title || !content || !author || !category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, content, author, category'
      }, { status: 400 });
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check for duplicate slug
    const existingPost = await queryDatabase(
      'SELECT id FROM blog_posts WHERE slug = $1',
      [finalSlug]
    );

    if (existingPost.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A post with this slug already exists'
      }, { status: 409 });
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const insertQuery = `
      INSERT INTO blog_posts (
        id, title, slug, excerpt, content, "featuredImage", images, author,
        category, tags, "isPublished", "publishedAt", "seoTitle", "seoDescription",
        views, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, NOW(), NOW()
      ) RETURNING id, title, slug, author, "isPublished"
    `;

    const values = [
      postId,
      title,
      finalSlug,
      excerpt || null,
      content,
      featuredImage || null,
      JSON.stringify(images),
      author,
      category,
      JSON.stringify(tags),
      isPublished,
      isPublished ? new Date() : null,
      seoTitle || title,
      seoDescription || excerpt
    ];

    const result = await queryDatabase(insertQuery, values);

    console.log(`✅ New blog post created: ${title} by ${author}`);

    return NextResponse.json({
      success: true,
      message: 'Blog post created successfully!',
      post: result[0]
    });

  } catch (error) {
    console.error('Error creating blog post:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create blog post'
    }, { status: 500 });
  }
}