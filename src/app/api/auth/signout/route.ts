// app/api/auth/signout/route.ts
import { createServerClient } from "../../../../lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(); // ADD AWAIT HERE
    
    await supabase.auth.signOut();

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.redirect(`${baseUrl}/`, { status: 302 });
  } catch (error) {
    console.error('Signout route error:', error);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    return NextResponse.redirect(
      `${baseUrl}/?error=Something%20went%20wrong`, 
      { status: 302 }
    );
  }
}