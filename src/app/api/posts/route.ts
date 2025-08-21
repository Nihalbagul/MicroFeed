// app/api/posts/route.ts
import { createServerClient } from "../../../lib/db";
import { NextResponse, NextRequest } from "next/server";

// Define interfaces for TypeScript
interface Profile {
  id: string;
  username: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  like_count: number;
  is_liked: boolean;
  profile: Profile | null;
}

// Define the type for insert data
interface PostInsertData {
  content: string;
  author_id: string;
  created_at: string;
  title?: string; // Optional field
}

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
      return NextResponse.json({ posts: [] as Post[], user });
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
    const transformedPosts = posts.map(post => {
      let profileData: Profile | null = null;
      if (post.profiles && Array.isArray(post.profiles) && post.profiles.length > 0) {
        profileData = {
          id: post.profiles[0].id,
          username: post.profiles[0].username
        };
      } else if (post.profiles && !Array.isArray(post.profiles)) {
        profileData = {
          id: (post.profiles as Profile).id,
          username: (post.profiles as Profile).username
        };
      }
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        user_id: post.author_id,
        like_count: likesMap.get(post.id) || 0,
        is_liked: userLikesSet.has(post.id),
        profile: profileData
      };
    });

    return NextResponse.json({ posts: transformedPosts as Post[], user });
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

    // Prepare insert data with proper typing
    const insertData: PostInsertData = {
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
      like_count: 0,
      is_liked: false,
      profile: data[0].profiles && Array.isArray(data[0].profiles) && data[0].profiles.length > 0
        ? {
            id: data[0].profiles[0].id,
            username: data[0].profiles[0].username
          }
        : data[0].profiles && !Array.isArray(data[0].profiles)
        ? {
            id: (data[0].profiles as Profile).id,
            username: (data[0].profiles as Profile).username
          }
        : null
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