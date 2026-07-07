import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight in-memory rate limiter
// Note: In a true Vercel serverless environment, memory is not shared across instances.
// However, this is sufficient for a demo/hackathon to show intent and protect against basic client-side spam.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

export function middleware(request: NextRequest) {
  // Only apply to specific API routes
  const protectedRoutes = ['/api/payments/create', '/api/ussd', '/api/insurance/process'];
  
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (isProtected) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    let record = rateLimitMap.get(ip);
    
    if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
      record = { count: 1, lastReset: now };
    } else {
      record.count += 1;
    }
    
    rateLimitMap.set(ip, record);
    
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      // Return 429 Too Many Requests
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
