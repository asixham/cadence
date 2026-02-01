/**
 * Check if the current device is a mobile device
 * Screen width is the top priority since it determines if UI elements will be visible properly
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Screen width is the top priority - determines if UI will work properly
  // Tesla displays and desktop devices need sufficient width for proper UI visibility
  const isMobileWidth = window.innerWidth < 1024;
  
  // If screen is too narrow, it's considered mobile regardless of device type
  if (isMobileWidth) {
    return true;
  }
  
  // Secondary check: user agent for mobile devices
  // This catches cases where screen might be wide enough but device is actually mobile
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // If user agent matches mobile patterns, return true
  return mobileRegex.test(userAgent);
}

