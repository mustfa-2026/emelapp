import React, { useState } from 'react';
import { Database, Key, Globe, Check, AlertCircle, X, ExternalLink, Shield, Copy, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, getSupabase } from '../utils/supabase';
import { playClick, playPop, playSuccessChime } from '../utils/sound';

export default function SupabaseModal({ isOpen, onClose, onConfigSaved, showToast }) {
  const currentConfig = getSupabaseConfig() || { url: '', key: '' };
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    playClick();

    if (!url.trim() || !key.trim()) {
      saveSupabaseConfig('', '');
      showToast('تم مسح إعدادات Supabase والعودة للتخزين المحلي', 'info');
      onConfigSaved();
      onClose();
      return;
    }

    setTesting(true);

    try {
      saveSupabaseConfig(url, key);
      const client = getSupabase();
      
      // Test select
      const { error } = await client.from('vaults').select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          showToast('متصل بـ Supabase! يرجى تشغيل كود SQL لإنشاء الجدول', 'info');
        } else {
          showToast('تحقق من صحة الرابط ومفتاح Anon', 'error');
        }
      } else {
        playSuccessChime();
        showToast('تم الاتصال بقاعدة بيانات Supabase بنجاح! 🟢', 'success');
      }

      onConfigSaved();
      onClose();
    } catch (err) {
      showToast('حدث خطأ أثناء الاتصال', 'error');
    } finally {
      setTesting(false);
    }
  };

  const copySqlCode = () => {
    playPop();
    const sql = `-- 1. إنشاء جدول الخزنة
CREATE TABLE IF NOT EXISTS public.vaults (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT DEFAULT '',
    label TEXT DEFAULT 'حساب بريد',
    notes TEXT DEFAULT '',
    service TEXT DEFAULT 'custom',
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. تفعيل الحماية
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- 3. سياسات الوصول
DROP POLICY IF EXISTS "Allow public read on vaults" ON public.vaults;
CREATE POLICY "Allow public read on vaults" ON public.vaults FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on vaults" ON public.vaults;
CREATE POLICY "Allow public insert on vaults" ON public.vaults FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on vaults" ON public.vaults;
CREATE POLICY "Allow public update on vaults" ON public.vaults FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on vaults" ON public.vaults;
CREATE POLICY "Allow public delete on vaults" ON public.vaults FOR DELETE USING (true);

-- 4. تفعيل التنبيهات اللحظية
ALTER PUBLICATION supabase_realtime ADD TABLE public.vaults;`;

    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      showToast('تم نسخ كود SQL لإنشاء الجدول في Supabase! 📋', 'success');
      setTimeout(() => setCopiedSql(false), 3000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          padding: '28px 24px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              ربط قاعدة بيانات Supabase
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              لحفظ الحسابات في السحابة ومزامنتها على Netlify
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Project URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              رابط المشروع (Project URL)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="glass-input"
                dir="ltr"
                style={{ textAlign: 'left', paddingLeft: '38px', fontFamily: 'var(--font-en)', fontSize: '0.9rem' }}
              />
              <Globe size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Anon Key */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              المفتاح العام (anon public key)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="glass-input"
                dir="ltr"
                style={{ textAlign: 'left', paddingLeft: '38px', fontFamily: 'var(--font-en)', fontSize: '0.85rem' }}
              />
              <Key size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* SQL Copy Box */}
          <div
            style={{
              borderRadius: '12px',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              هل أنشأت الجداول في Supabase؟
            </div>
            <button
              type="button"
              onClick={copySqlCode}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              {copiedSql ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedSql ? 'تم نسخ كود SQL' : 'نسخ كود SQL للجدول'}</span>
            </button>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={testing}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              <Check size={18} />
              <span>{testing ? 'جاري التحقق...' : 'حفظ واختبار الاتصال'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
