import Bowser from 'bowser';

import type { H3Event } from 'h3';

export interface DeviceDetails {
  browser: string | null
  os: string | null
  platform: string | null
}

function combineNameAndVersion(
  value: { name?: string, version?: string },
): string | null {
  if (!value.name) return null;
  return [value.name, value.version].filter(Boolean).join(' ');
}

export function getDeviceDetails(event: H3Event): DeviceDetails {
  const userAgent = getRequestHeader(event, 'user-agent');
  if (!userAgent) return { browser: null, os: null, platform: null };

  const result = Bowser.parse(userAgent);
  return {
    browser: combineNameAndVersion(result.browser),
    os: combineNameAndVersion(result.os),
    platform: result.platform.type ?? null,
  };
}
