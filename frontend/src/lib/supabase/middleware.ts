import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip Supabase session management if not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Supabase not configured - skip auth middleware
    return response;
  }

  try {
    let mutableResponse = response;

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          mutableResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          mutableResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          mutableResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          mutableResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    });

    // Refresh session if expired
    await supabase.auth.getUser();

    return mutableResponse;
  } catch (error) {
    // If Supabase throws an error, continue without auth
    console.warn('Supabase middleware error:', error);
    return response;
  }
}
