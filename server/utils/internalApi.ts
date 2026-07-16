import { createError, getHeader } from 'h3';

import type { H3Event } from 'h3';

export function requireInternalApiAccess(event: H3Event): void {
  const { internalApiSecret } = useRuntimeConfig();

  if (!internalApiSecret) {
    throw createError({
      statusCode: 503,
      message: 'Internal API secret is not configured',
    });
  }

  const requestSecret = getHeader(event, 'x-internal-api-secret');

  if (requestSecret !== internalApiSecret) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }
}
