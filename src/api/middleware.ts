import { type NextRequest, NextResponse } from 'next/server';
import { buildCORSHeaders } from '../api/lib/cors';
import { addSecurityHeaders } from '../api/middleware/security';

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = buildCORSHeaders(origin);

  // Handle preflight (OPTIONS) requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    addSecurityHeaders(response);
    return response;
  }

  // For all other requests, add CORS and security headers
  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  addSecurityHeaders(response);
  return response;
}
