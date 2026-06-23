import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Types
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
}

// Context with env
const app = new Hono<{ Bindings: Env }>();

// Helper: get Supabase admin client
function getSupabase(c: any) {
  const url = c.env.SUPABASE_URL || 'https://pgkgkvvgfxmxtbhcdyhj.supabase.co';
  const key = c.env.SUPABASE_SERVICE_KEY || c.env.SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Helper: simple JWT
async function signJwt(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  const payloadBase64 = btoa(JSON.stringify(payload));
  return `${payloadBase64}.${sigBase64}`;
}

async function verifyJwt(token: string, secret: string): Promise<any | null> {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return null;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
    const payloadData = encoder.encode(atob(payloadB64));
    const valid = await crypto.subtle.verify('HMAC', key, sig, payloadData);
    if (!valid) return null;
    return JSON.parse(atob(payloadB64));
  } catch { return null; }
}

// CORS middleware
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

// ====== AUTH ROUTES ======

// Register
app.post('/api/auth/register', async (c) => {
  const { username, password, name } = await c.req.json();
  if (!username || !password) return c.json({ error: 'Username and password required' }, 400);

  const supabase = getSupabase(c);

  // Check if exists
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) return c.json({ error: 'Username already exists' }, 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({
    username,
    passwordHash,
    name: name || username,
    role: 'user',
  }).select().single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, user: { id: data.id, username: data.username, name: data.name } });
});

// Login
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: 'Username and password required' }, 400);

  const supabase = getSupabase(c);
  const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();

  if (error || !user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  // Update last sign in
  await supabase.from('users').update({ lastSignInAt: new Date().toISOString() }).eq('id', user.id);

  const secret = c.env.JWT_SECRET || 'private-desktop-secret';
  const token = await signJwt({ userId: user.id, username: user.username, role: user.role }, secret);

  return c.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
});

// Get current user
app.get('/api/auth/me', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  const token = auth.slice(7);
  const secret = c.env.JWT_SECRET || 'private-desktop-secret';
  const payload = await verifyJwt(token, secret);
  if (!payload) return c.json({ error: 'Invalid token' }, 401);

  const supabase = getSupabase(c);
  const { data: user } = await supabase.from('users').select('id,username,name,role').eq('id', payload.userId).single();
  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json(user);
});

// ====== NOTES ROUTES ======

app.get('/api/notes', async (c) => {
  const auth = c.req.header('Authorization');
  let userId = null;
  if (auth?.startsWith('Bearer ')) {
    const secret = c.env.JWT_SECRET || 'private-desktop-secret';
    const payload = await verifyJwt(auth.slice(7), secret);
    userId = payload?.userId || null;
  }

  const supabase = getSupabase(c);
  const query = userId
    ? supabase.from('notes').select('*').or(`userId.eq.${userId},userId.is.null`)
    : supabase.from('notes').select('*').is('userId', null);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

app.post('/api/notes', async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('notes').insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.put('/api/notes/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('notes').update(body).eq('itemId', id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.delete('/api/notes/:id', async (c) => {
  const id = c.req.param('id');
  const supabase = getSupabase(c);
  await supabase.from('notes').delete().eq('itemId', id);
  return c.json({ success: true });
});

// ====== RECIPES ROUTES ======

app.get('/api/recipes', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('recipes').select('*');
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

app.post('/api/recipes', async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('recipes').insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.put('/api/recipes/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('recipes').update(body).eq('recipeId', id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.delete('/api/recipes/:id', async (c) => {
  const id = c.req.param('id');
  const supabase = getSupabase(c);
  await supabase.from('recipes').delete().eq('recipeId', id);
  return c.json({ success: true });
});

// ====== DESKTOP ITEMS ======

app.get('/api/desktop-items', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('desktop_items').select('*');
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

app.post('/api/desktop-items', async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('desktop_items').insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.put('/api/desktop-items/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('desktop_items').update(body).eq('itemId', id).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.delete('/api/desktop-items/:id', async (c) => {
  const id = c.req.param('id');
  const supabase = getSupabase(c);
  await supabase.from('desktop_items').delete().eq('itemId', id);
  return c.json({ success: true });
});

// ====== HEALTH ======

app.get('/api/health', (c) => c.json({ status: 'ok', time: Date.now() }));

// Export for Cloudflare Pages Functions
export const onRequest = app.fetch;
