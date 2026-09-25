import { DeviceInfo, GraphicSettings } from '../types/game';

export function detectDeviceHardware(): DeviceInfo {
  let gpuVendor = 'Generic GPU';
  let gpuRenderer = 'Standard WebGL Engine';
  let vramEstimatedMB = 2048;

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'WebGL Vendor';
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'WebGL Renderer';
      }

      // Estimate VRAM based on renderer name & max texture size
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      if (maxTextureSize >= 16384) vramEstimatedMB = 8192;
      else if (maxTextureSize >= 8192) vramEstimatedMB = 6144;
      else if (maxTextureSize >= 4096) vramEstimatedMB = 4096;
      else vramEstimatedMB = 2048;

      if (/RTX|GTX|Radeon RX|Apple M[1234]|GeForce|Adreno 7|Apple GPU/i.test(gpuRenderer)) {
        vramEstimatedMB = Math.max(vramEstimatedMB, 8192);
      }
    }
  } catch (e) {
    console.warn('WebGL detection fallback:', e);
  }

  // CPU cores
  const cpuCores = navigator.hardwareConcurrency || 8;

  // RAM estimate (in GB, clamped by browser API privacy)
  // @ts-ignore
  const ramGB = (navigator.deviceMemory as number) || (cpuCores >= 8 ? 16 : 8);

  // Platform & User Agent detection
  const ua = navigator.userAgent;
  let devicePlatform = 'Desktop Workstation';
  if (/Android/i.test(ua)) devicePlatform = 'Android Mobile / Tablet';
  else if (/iPhone|iPad|iPod/i.test(ua)) devicePlatform = 'Apple iOS Device';
  else if (/Macintosh|Mac OS X/i.test(ua)) devicePlatform = 'Apple macOS System';
  else if (/Windows/i.test(ua)) devicePlatform = 'Microsoft Windows PC';
  else if (/Linux/i.test(ua)) devicePlatform = 'Linux Terminal Station';

  let browser = 'Modern Web Browser';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

  const screenRefreshRate = window.screen && (window.screen as any).refreshRate ? (window.screen as any).refreshRate : 60;

  // Determine Performance Tier
  let tier: 'Low' | 'Balanced' | 'High' | 'Ultra RTX' = 'Balanced';
  if (/RTX|Apple M[234]|Radeon RX 7|Radeon RX 6|GeForce 40|GeForce 30/i.test(gpuRenderer) && cpuCores >= 8) {
    tier = 'Ultra RTX';
  } else if (/GTX|Apple M1|GeForce|Radeon|Adreno 6/i.test(gpuRenderer) || cpuCores >= 6) {
    tier = 'High';
  } else if (cpuCores <= 4 || /Mali-4|Adreno 5/i.test(gpuRenderer)) {
    tier = 'Low';
  }

  return {
    gpuVendor,
    gpuRenderer,
    vramEstimatedMB,
    cpuCores,
    ramGB,
    screenRefreshRate,
    resolution: `${window.innerWidth}x${window.innerHeight} (${window.devicePixelRatio.toFixed(1)}x DPR)`,
    devicePlatform,
    browser,
    tier
  };
}

export function getDefaultGraphicSettings(tier: 'Low' | 'Balanced' | 'High' | 'Ultra RTX'): GraphicSettings {
  switch (tier) {
    case 'Ultra RTX':
      return {
        rayTracingEnabled: true,
        pathTracingSim: true,
        aiFrameGeneration: true,
        bloomEnabled: true,
        celShadingOutlines: true,
        shadowQuality: 'ultra',
        crtFilter: false,
        particleDensity: 'ultra',
        targetFps: 120
      };
    case 'High':
      return {
        rayTracingEnabled: true,
        pathTracingSim: false,
        aiFrameGeneration: true,
        bloomEnabled: true,
        celShadingOutlines: true,
        shadowQuality: 'medium',
        crtFilter: false,
        particleDensity: 'high',
        targetFps: 60
      };
    case 'Balanced':
      return {
        rayTracingEnabled: false,
        pathTracingSim: false,
        aiFrameGeneration: false,
        bloomEnabled: true,
        celShadingOutlines: true,
        shadowQuality: 'medium',
        crtFilter: false,
        particleDensity: 'medium',
        targetFps: 60
      };
    case 'Low':
    default:
      return {
        rayTracingEnabled: false,
        pathTracingSim: false,
        aiFrameGeneration: false,
        bloomEnabled: false,
        celShadingOutlines: false,
        shadowQuality: 'off',
        crtFilter: false,
        particleDensity: 'low',
        targetFps: 30
      };
  }
}
