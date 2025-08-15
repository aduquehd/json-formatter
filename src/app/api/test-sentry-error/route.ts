import { NextResponse } from 'next/server';

export async function GET() {
  // Only throw error in production or if explicitly requested
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test API Error: This is a test error from the API route!');
  }
  
  // In development, return an error response without throwing
  return NextResponse.json(
    { error: 'Test API Error (not thrown in development)' },
    { status: 500 }
  );
}