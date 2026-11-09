/**
 * Earthfall: Beyond the Solar System - Hardware & Device Auto-Detection
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  isPortrait: boolean;
  deviceLabel: string;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isTouch: false,
      isPortrait: false,
      deviceLabel: 'Desktop PC',
    };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Mobile UA regex
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  const isMobileUA = mobileRegex.test(ua);
  
  // Tablet detection (iPad or Android tablet)
  const isTabletUA = /iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));

  // Touch capability
  const hasTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Pointer coarse query (touchscreen primary pointer)
  const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // Viewport width heuristic
  const isNarrowScreen = window.innerWidth <= 840;
  const isPortrait = window.innerHeight > window.innerWidth;

  // Composite mobile determination
  const isMobile = isMobileUA || (hasTouch && (isCoarsePointer || isNarrowScreen));
  const isTablet = isTabletUA || (hasTouch && !isMobileUA && window.innerWidth >= 600 && window.innerWidth <= 1024);

  let deviceLabel = 'Desktop PC';
  if (isTablet) {
    deviceLabel = 'Tablet Device';
  } else if (isMobile) {
    deviceLabel = 'Mobile Phone';
  }

  return {
    isMobile,
    isTablet,
    isTouch: hasTouch,
    isPortrait,
    deviceLabel,
  };
}
