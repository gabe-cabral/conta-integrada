export default defineEventHandler(async (event) => {
  // const { user } = await requireUserSession(event)

  try {
    const method = event.node.req.method;

    if (method === 'GET') {
      const response = await fetch(
        'https://app.organizze.com.br/zze_front/credit_cards?status=all',
        {
          credentials: 'include',
          headers: {
            'current-entity-id': process.env.ORGANIZZE_ENTITY_ID || '',
            'X-AUTH-TOKEN': process.env.ORGANIZZE_AUTH_TOKEN || '',
          },
          referrer: `https://app.organizze.com.br/${process.env.ORGANIZZE_ENTITY_ID}/a/lancamentos`,
          method: 'GET',
          // mode: 'cors',
        },
      );

      if (!response.ok) return { error: 'Failed to fetch cards' };

      const result = await response.json();

      return result.filter((c: { archived: boolean }) => !c.archived);
    }

    event.node.res.statusCode = 405;
    return { error: 'Method not allowed' };
  } catch (error) {
    event.node.res.statusCode = 500;
    return { error: 'Internal Server Error', details: error };
  }
});
