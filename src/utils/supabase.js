import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials
const DEFAULT_SUPABASE_URL = 'https://yxlqqjhfnikjuuuiekcq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHFxamhmbmlranV1dWlla2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODY3NjYsImV4cCI6MjEwMjU2Mjc2Nn0.JrpxEEOgjx9pzRHYmHUUCGFDvmbKjSLPByLJ_IZB2ss';

const CONFIG_KEY = 'uservault_supabase_config_v1';

export function getSupabaseConfig() {
  try {
    const local = localStorage.getItem(CONFIG_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.url && parsed.key) return parsed;
    }
  } catch (e) {}

  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
}

export function saveSupabaseConfig(url, key) {
  if (!url || !key) {
    localStorage.removeItem(CONFIG_KEY);
  } else {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
  }
}

let supabaseInstance = null;
let lastConfigHash = '';

export function getSupabase() {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.key) {
    return null;
  }

  const hash = `${config.url}_${config.key}`;
  if (!supabaseInstance || lastConfigHash !== hash) {
    supabaseInstance = createClient(config.url, config.key, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastConfigHash = hash;
  }

  return supabaseInstance;
}

export function isSupabaseConfigured() {
  return Boolean(getSupabase());
}

/**
 * Database operations
 */

export async function dbFetchVaults() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('vaults')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error);
    throw error;
  }

  return data.map((item) => ({
    id: item.id,
    email: item.email,
    password: item.password,
    label: item.label,
    notes: item.notes,
    service: item.service,
    claimed: item.claimed,
    openedAt: item.opened_at ? new Date(item.opened_at).getTime() : null,
    createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
  }));
}

export async function dbCreateVault(vault) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const payload = {
    id: vault.id,
    email: vault.email,
    password: vault.password || '',
    label: vault.label || 'حساب بريد',
    notes: vault.notes || '',
    service: vault.service || 'custom',
    claimed: false,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('vaults')
    .upsert([payload])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
    password: data.password,
    label: data.label,
    notes: data.notes,
    service: data.service,
    claimed: data.claimed,
    createdAt: new Date(data.created_at).getTime()
  };
}

export async function dbDeleteVault(id) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('vaults')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase delete error:', error);
    return false;
  }

  return true;
}

export async function dbGetVault(id) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('vaults')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.warn('dbGetVault not found or error:', error);
    return null;
  }

  // Mark as opened
  if (!data.opened_at) {
    supabase
      .from('vaults')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', id)
      .then(() => {});
  }

  return {
    id: data.id,
    email: data.email,
    password: data.password,
    label: data.label,
    notes: data.notes,
    service: data.service,
    claimed: data.claimed
  };
}

export async function dbClaimVault(id) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('vaults')
    .update({
      claimed: true,
      claimed_at: new Date().toISOString()
    })
    .eq('id', id);

  return !error;
}
