// app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "../../../../../lib/db";



export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    console.log('POST like request for post:', id);

    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth user:', user?.id);
    console.log('Auth error:', authError);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", id)
      .single();

    console.log('Post check:', post, postError);

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this post
    const { data: existingLike, error: likeError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    console.log('Existing like check:', existingLike, likeError);

    if (likeError) {
      console.error('Error checking existing like:', likeError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existingLike) {
      // User already liked this post
      const { data: likesData } = await supabase
        .from("likes")
        .select("user_id")
        .eq("post_id", id);

      const like_count = likesData?.length || 0;
      const is_liked = true;

      return NextResponse.json({ like_count, is_liked });
    }

    // Create new like
    const { error: insertError } = await supabase
      .from("likes")
      .insert({
        post_id: id,
        user_id: user.id,
      });

    if (insertError) {
      console.error('Error creating like:', insertError);
      return NextResponse.json(
        { error: 'Failed to create like' },
        { status: 500 }
      );
    }

    // Get updated like count
    const { data: likesData } = await supabase
      .from("likes")
      .select("user_id")
      .eq("post_id", id);

    const like_count = likesData?.length || 0;
    const is_liked = true;

    return NextResponse.json({ like_count, is_liked });

  } catch (error) {
    console.error('Unexpected error in POST like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    console.log('DELETE like request for post:', id);

    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Remove like
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error('Error removing like:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove like' },
        { status: 500 }
      );
    }

    // Get updated like count
    const { data: likesData } = await supabase
      .from("likes")
      .select("user_id")
      .eq("post_id", id);

    const like_count = likesData?.length || 0;
    const is_liked = false;

    return NextResponse.json({ like_count, is_liked });

  } catch (error) {
    console.error('Unexpected error in DELETE like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}