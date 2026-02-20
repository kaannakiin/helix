import { UAParser } from 'ua-parser-js';
import type { DeviceType } from '@org/prisma/client';

export interface ParsedUserAgent {
  browserName: string | undefined;
  browserVersion: string | undefined;
  osName: string | undefined;
  osVersion: string | undefined;
  deviceType: DeviceType;
  fingerprint: string;
}

export function parseUserAgent(userAgent: string | undefined): ParsedUserAgent {
  const parser = new UAParser(userAgent || '');
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const deviceType = mapDeviceType(device.type);

  const fingerprintSource = [
    browser.name,
    browser.major,
    os.name,
    os.version,
    device.vendor,
    device.model,
    device.type,
  ]
    .filter(Boolean)
    .join('|');

  return {
    browserName: browser.name,
    browserVersion: browser.version,
    osName: os.name,
    osVersion: os.version,
    deviceType,
    fingerprint: fingerprintSource,
  };
}

function mapDeviceType(type: string | undefined): DeviceType {
  switch (type) {
    case 'mobile':
      return 'MOBILE';
    case 'tablet':
      return 'TABLET';
    case 'console':
    case 'smarttv':
    case 'wearable':
    case 'embedded':
      return 'UNKNOWN';
    default:
      return 'DESKTOP';
  }
}
