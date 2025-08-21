// app/api/posts/route.ts
import { createServerClient } from "../../../lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const filter = searchParams.get('filter') || 'all';

    let queryBuilder = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        author_id,
        profiles(
          id,
          username
        )
      `)
      .order('created_at', { ascending: false });

    // Apply search filter if query exists
    if (query) {
      queryBuilder = queryBuilder.ilike('content', `%${query}%`);
    }

    // Apply filter
    if (filter === 'mine' && user) {
      queryBuilder = queryBuilder.eq('author_id', user.id);
    }

    const { data: posts, error } = await queryBuilder;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [], user });
    }

    // Get all likes for these posts in one query
    const postIds = posts.map(p => p.id);
    const { data: allLikes } = await supabase
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    // Process likes data
    const likesMap = new Map();
    const userLikesSet = new Set();

    allLikes?.forEach(like => {
      // Count likes per post
      const currentCount = likesMap.get(like.post_id) || 0;
      likesMap.set(like.post_id, currentCount + 1);

      // Track user's likes
      if (user && like.user_id === user.id) {
        userLikesSet.add(like.post_id);
      }
    });

    // Transform the data to match your PostCard component expectations
    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      user_id: post.author_id,
      like_count: likesMap.get(post.id) || 0,
      is_liked: userLikesSet.has(post.id),
      profile: post.profiles ? {
        id: post.profiles.id,
        username: post.profiles.username
      } : null
    }));

    return NextResponse.json({ posts: transformedPosts, user });
  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const content = String(body.content || '').trim();
    const title = String(body.title || '').trim();

    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Prepare insert data
    const insertData: any = {
      content,
      author_id: user.id,
      created_at: new Date().toISOString(),
    };

    // Add optional fields
    if (title) {
      insertData.title = title;
    }

    console.log('Inserting post with data:', {
      ...insertData,
      user_id: user.id // For debugging
    });

    // Insert the post
    const { data, error } = await supabase
      .from('posts')
      .insert([insertData])
      .select(`
        id,
        title,
        content,
        created_at,
        author_id,
        profiles(
          id,
          username
        )
      `);

    if (error) {
      console.error('Insert error:', error);
      
      // Handle specific RLS policy violations
      if (error.message.includes('new row violates row-level security policy')) {
        return NextResponse.json({ 
          error: 'Permission denied. Please check your authentication.' 
        }, { status: 403 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the response to match your PostCard component expectations
    const transformedPost = data?.[0] ? {
      id: data[0].id,
      title: data[0].title,
      content: data[0].content,
      created_at: data[0].created_at,
      user_id: data[0].author_id,
      like_count: 0, // New posts start with 0 likes
      is_liked: false, // User can't have liked a new post yet
      profile: data[0].profiles ? {
        id: data[0].profiles.id,
        username: data[0].profiles.username
      } : null
    } : null;

    return NextResponse.json({
      post: transformedPost,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('Posts POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}