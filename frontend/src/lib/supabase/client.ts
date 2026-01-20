'use client';

import { createBrowserClient } from '@supabase/ssr';

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a mock client that does nothing
    // This allows the app to run without Supabase configured
    console.warn('Supabase is not configured. Auth features will be disabled.');
    return null;
  }

  return createBrowserClient(supabaseUrl!, supabaseKey!);
}

// Singleton client for client-side usage
let browserClient: ReturnType<typeof createBrowserClient> | null = null;
let clientInitialized = false;

export function getSupabaseClient() {
  if (!clientInitialized) {
    clientInitialized = true;
    if (isSupabaseConfigured()) {
      browserClient = createBrowserClient(supabaseUrl!, supabaseKey!);
    }
  }
  return browserClient;
}
