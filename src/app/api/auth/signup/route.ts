// app/api/auth/signup/route.ts (rename from .js to .ts)
import { createServerClient } from "../../../../lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const formData = await request.formData();
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`
      }
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(error.message)}`, 
        { status: 302 }
      );
    }

    return NextResponse.redirect(`${baseUrl}/?message=Check%20email%20to%20verify`, { status: 302 });
  } catch (error) {
    console.error('Signup route error:', error);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    return NextResponse.redirect(
      `${baseUrl}/?error=Something%20went%20wrong`, 
      { status: 302 }
    );
  }
}