import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
      // First check headers with HEAD request
      const headRes = await fetch(url, { 
        method: 'HEAD', 
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Check X-Frame-Options header
      const xfo = headRes.headers.get('x-frame-options');
      if (xfo && xfo.toLowerCase() !== 'allowall') {
        return NextResponse.json({ canEmbed: false, reason: 'X-Frame-Options' });
      }

      // Check Content-Security-Policy header
      const csp = headRes.headers.get('content-security-policy');
      if (csp && csp.toLowerCase().includes('frame-ancestors')) {
        // Check if frame-ancestors allows embedding
        const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
        if (frameAncestorsMatch) {
          const value = frameAncestorsMatch[1].toLowerCase();
          // If it's 'none', it blocks embedding
          if (value.includes('none')) {
            return NextResponse.json({ canEmbed: false, reason: 'CSP frame-ancestors: none' });
          }
        } else {
          // If frame-ancestors is present but we can't parse it, assume it might block
          return NextResponse.json({ canEmbed: false, reason: 'CSP frame-ancestors present' });
        }
      }

      // Check if page actually loads by fetching the content
      const contentRes = await fetch(url, { 
        method: 'GET', 
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Check HTTP status
      if (!contentRes.ok) {
        return NextResponse.json({ canEmbed: false, reason: `HTTP ${contentRes.status}` });
      }

      // Read a portion of the content to check for error messages
      const text = await contentRes.text();
      const lowerText = text.toLowerCase();
      
      // Check for common error messages
      const errorPatterns = [
        'temporarily down',
        'moved permanently',
        'this site can\'t be reached',
        'this webpage is not available',
        'page not found',
        '404',
        '403 forbidden',
        'access denied',
        'server error',
        'service unavailable',
        'bad gateway',
        'gateway timeout',
      ];

      for (const pattern of errorPatterns) {
        if (lowerText.includes(pattern)) {
          // Check if it's in a prominent location (title, body, or common error containers)
          const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
          const bodyMatch = text.match(/<body[^>]*>([\s\S]{0,500})/i);
          
          if (titleMatch && titleMatch[1].toLowerCase().includes(pattern)) {
            return NextResponse.json({ canEmbed: false, reason: 'Page error detected' });
          }
          
          if (bodyMatch && bodyMatch[1].toLowerCase().includes(pattern)) {
            // Make sure it's not just a mention in the content, but an actual error
            // Check if it's in common error message contexts
            const errorContexts = [
              /the webpage at[^<]*might be temporarily down/i,
              /may have moved permanently/i,
              /this site can't be reached/i,
              /this webpage is not available/i,
            ];
            
            for (const context of errorContexts) {
              if (context.test(bodyMatch[1])) {
                return NextResponse.json({ canEmbed: false, reason: 'Page error detected' });
              }
            }
          }
        }
      }

      return NextResponse.json({ canEmbed: true });
    } catch (fetchError) {
      // If fetch fails, we can't determine, so assume it might work
      // The client-side detection will catch actual errors
      return NextResponse.json({ canEmbed: true });
    }
  } catch (error) {
    console.error('Error checking embed:', error);
    return NextResponse.json({ error: 'Failed to check embed status' }, { status: 500 });
  }
}

