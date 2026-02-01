/**
 * Get the current app URL (production or localhost)
 */
export function getAppUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://cadence-roan.vercel.app';
  }
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3000`;
  }
  
  return `https://${hostname}`;
}

/**
 * Check if the app is in Tesla Theater mode (loaded via YouTube redirect)
 */
export function isFullscreen(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if we've already detected and stored this in sessionStorage
  const stored = sessionStorage.getItem('tesla-theater-mode');
  if (stored === 'true') {
    return true;
  }
  
  // Check if loaded via YouTube redirect (Tesla Theater)
  const fromYouTubeRedirect = document.referrer.includes('youtube.com/redirect');
  
  // Check if running in Tesla browser
  const isTesla = /QtCarBrowser|Tesla/i.test(navigator.userAgent);
  
  // Check URL parameter (if we added it to the redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const hasTeslaParam = urlParams.get('tesla') === '1';
  
  // Return true if referrer matches OR (Tesla browser AND param matches)
  const isTheaterMode = fromYouTubeRedirect || (isTesla && hasTeslaParam);
  
  // Store the result in sessionStorage for persistence
  if (isTheaterMode) {
    sessionStorage.setItem('tesla-theater-mode', 'true');
  }
  
  return isTheaterMode;
}

/**
 * Open a URL using YouTube redirect method for Tesla Theater
 * If already in Tesla Theater mode, opens the URL directly without redirect
 */
export function openWithYouTubeRedirect(url: string): void {
  // If already in Tesla Theater mode, open the URL directly
  if (isFullscreen()) {
    window.location.href = url;
    return;
  }
  
  // Otherwise, use YouTube redirect to enter Tesla Theater mode
  // Add tesla=1 parameter to the URL for explicit detection
  const urlWithParam = url.includes('?') 
    ? `${url}&tesla=1` 
    : `${url}?tesla=1`;
  const encodedUrl = encodeURIComponent(urlWithParam);
  const redirectUrl = `https://www.youtube.com/redirect?q=${encodedUrl}`;
  
  window.location.href = redirectUrl;
}

