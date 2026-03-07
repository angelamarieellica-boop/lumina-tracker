exports.handler = async function(event) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method not allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Supabase not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { action, table, data, match } = body;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates,return=representation'
  };

  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    let method = 'GET';
    let reqBody = null;

    if (action === 'upsert') {
      method = 'POST';
      reqBody = JSON.stringify(Array.isArray(data) ? data : [data]);
    } else if (action === 'select') {
      const params = new URLSearchParams();
      if (match) Object.entries(match).forEach(([k,v]) => params.append(k, `eq.${v}`));
      if (url.includes('?')) url += '&' + params.toString();
      else if (params.toString()) url += '?' + params.toString();
      method = 'GET';
    } else if (action === 'delete') {
      const params = new URLSearchParams();
      if (match) Object.entries(match).forEach(([k,v]) => params.append(k, `eq.${v}`));
      url += '?' + params.toString();
      method = 'DELETE';
    }

    const response = await fetch(url, { method, headers, body: reqBody });
    const text = await response.text();
    const result = text ? JSON.parse(text) : [];

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
