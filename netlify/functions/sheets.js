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

  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { method, path, data, sheetId } = body;
  if (!sheetId) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing sheetId' }) };
  }

  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
  const sep = path.includes('?') ? '&' : '?';
  const url = path.startsWith('http') ? `${path}${sep}key=${API_KEY}` : `${base}${path}${sep}key=${API_KEY}`;

  const opts = {
    method: method || 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) opts.body = JSON.stringify(data);

  try {
    const response = await fetch(url, opts);
    const result = await response.json();
    return {
      statusCode: response.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch(e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
