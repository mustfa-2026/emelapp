import React, { useState, useEffect } from 'react';
import {
  Mail,
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Share2,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  CheckCircle2,
  MessageCircle,
  Send,
  Lock,
  Layers,
  Database,
  Settings
} from 'lucide-react';
import { encodeVaultPayload } from '../utils/crypto';
import { playClick, playPop, playSuccessChime, playAlert } from '../utils/sound';
import {
  dbFetchVaults,
  dbCreateVault,
  dbDeleteVault,
  getSupabase,
  isSupabaseConfigured
} from '../utils/supabase';
import SupabaseModal from './SupabaseModal';

const DOMAIN_CHIPS = ['@gmail.com', '@outlook.com', '@icloud.com', '@yahoo.com', '@hotmail.com'];
const STORAGE_KEY = 'uservault_personal_accounts_v1';

export default function Dashboard({ showToast }) {
  const [accounts, setAccounts] = useState(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [copiedId, setCopiedId] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [liveEvents, setLiveEvents] = useState({});
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [hasSupabase, setHasSupabase] = useState(isSupabaseConfigured());

  // Load accounts from Supabase or Local
  const loadAccounts = async () => {
    setHasSupabase(isSupabaseConfigured());
    if (isSupabaseConfigured()) {
      try {
        const data = await dbFetchVaults();
        if (data) {
          setAccounts(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch error, fallback to local', err);
      }
    }

    // Fallback: Local Server or LocalStorage
    fetch('/api/vaults')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Save to LocalStorage whenever accounts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {}
  }, [accounts]);

  // Realtime Listeners (Supabase Realtime)
  useEffect(() => {
    const supabase = getSupabase();
    let channel = null;

    if (supabase) {
      // Supabase Postgres Realtime Subscription
      channel = supabase
        .channel('public:vaults')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vaults' },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new;
              if (updated.claimed) {
                playSuccessChime();
                setLiveEvents((prev) => ({ ...prev, [updated.id]: 'claimed' }));
                showToast('🎉 تم النقر على "موافق" وإضافة البريد في الهاتف!', 'success');
              } else if (updated.opened_at) {
                playAlert();
                setLiveEvents((prev) => ({ ...prev, [updated.id]: 'opened' }));
                showToast('📱 تم فتح الرابط على الهاتف الآن!', 'info');
              }
            } else if (payload.eventType === 'INSERT') {
              setAccounts((prev) => {
                if (prev.some((a) => a.id === payload.new.id)) return prev;
                return [{ ...payload.new, createdAt: new Date(payload.new.created_at).getTime() }, ...prev];
              });
            } else if (payload.eventType === 'DELETE') {
              setAccounts((prev) => prev.filter((a) => a.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [hasSupabase]);

  const handleDomainChip = (domain) => {
    playClick();
    if (!email) {
      setEmail(`user${domain}`);
      return;
    }
    const atIndex = email.indexOf('@');
    if (atIndex !== -1) {
      setEmail(email.substring(0, atIndex) + domain);
    } else {
      setEmail(email + domain);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('يرجى كتابة بريد إلكتروني صحيح', 'error');
      return;
    }

    setIsSubmitting(true);
    playClick();

    const newId = Math.random().toString(36).substring(2, 10);
    const newAccountData = {
      id: newId,
      email: email.trim(),
      password: password.trim(),
      label: label.trim() || 'حساب بريد',
      service: email.toLowerCase().includes('gmail')
        ? 'gmail'
        : email.toLowerCase().includes('outlook')
        ? 'outlook'
        : 'custom'
    };

    let addedSuccessfully = false;

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const saved = await dbCreateVault(newAccountData);
        if (saved) {
          setAccounts((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
          addedSuccessfully = true;
        }
      } catch (err) {
        console.warn('Supabase insert failed', err);
      }
    }

    // 2. Try Server / Local fallback if not saved to Supabase
    if (!addedSuccessfully) {
      try {
        const res = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAccountData)
        });
        if (res.ok) {
          const { vault } = await res.json();
          setAccounts((prev) => [vault, ...prev.filter((a) => a.id !== vault.id)]);
          addedSuccessfully = true;
        }
      } catch (err) {}
    }

    // 3. Local fallback
    if (!addedSuccessfully) {
      setAccounts((prev) => [{ ...newAccountData, createdAt: Date.now(), claimed: false }, ...prev]);
    }

    playSuccessChime();
    showToast('تمت إضافة البريد إلى لوحتك بنجاح! جاهز لنسخ الرابط 📋', 'success');

    setEmail('');
    setPassword('');
    setLabel('');
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    playClick();
    if (!window.confirm('هل أنت متأكد من حذف هذا البريد من لوحتك؟')) return;

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (isSupabaseConfigured()) {
      dbDeleteVault(id).catch(() => {});
    }
    fetch(`/api/vault/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('تم حذف البريد من اللوحة', 'info');
  };

  const getAccountLink = (acc) => {
    if (acc.id) {
      return `${window.location.origin}/?v=${acc.id}`;
    }
    const hash = encodeVaultPayload(acc);
    return `${window.location.origin}/#vault=${hash}`;
  };

  const handleCopyLink = async (acc) => {
    playPop();
    const link = getAccountLink(acc);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const temp = document.createElement('input');
        temp.value = link;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopiedId(acc.id);
      showToast(`تم نسخ رابط (${acc.email}) بنجاح! أرسله لهاتفك 📋`, 'success');
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  const shareViaWhatsApp = (acc) => {
    playClick();
    const link = getAccountLink(acc);
    const text = encodeURIComponent(`افتح الرابط لإضافة بريد (${acc.email}) إلى هاتفك فوراً:\n${link}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px 50px 16px', width: '100%' }} className="animate-fade-in">
      
      {/* Top Banner / Heading */}
      <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative' }}>
        
        {/* Supabase Status Button */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
          <button
            onClick={() => {
              playClick();
              setIsSupabaseModalOpen(true);
            }}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '999px',
              borderColor: hasSupabase ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              background: hasSupabase ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: hasSupabase ? '#34d399' : '#f59e0b'
            }}
          >
            <Database size={14} />
            <span>{hasSupabase ? '🟢 متصل بقاعدة Supabase' : '⚡ ربط قاعدة بيانات Supabase'}</span>
          </button>
        </div>

        <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
          لوحة إدارة البريدات والحسابات
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          أضف بريداتك ورموزها هنا، وانسخ رابط أي بريد بضغطة زر لإضافته في هاتفك فوراً عند النقر على "موافق".
        </p>
      </div>

      {/* 1. ADD NEW EMAIL CARD (Form) */}
      <div className="glass-panel" style={{ padding: '28px 24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} color="var(--accent-cyan)" />
          <span>إضافة بريد جديد إلى لوحتك</span>
        </h3>

        <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end' }}>
          
          {/* Email input */}
          <div style={{ gridColumn: 'span 2 / span 2' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              البريد الإلكتروني <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                dir="ltr"
                style={{ textAlign: 'left', paddingLeft: '40px', fontFamily: 'var(--font-en)' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {/* Smart Domain Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {DOMAIN_CHIPS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDomainChip(d)}
                  className="provider-chip"
                  style={{ fontFamily: 'var(--font-en)', direction: 'ltr', fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Password / App Key */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              الرمز / كلمة المرور (اختياري)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="رمز المرور أو App Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                dir="ltr"
                style={{ textAlign: 'left', paddingLeft: '40px', fontFamily: 'var(--font-en)' }}
              />
              <Key size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Label / Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              اسم الحساب / التسمية
            </label>
            <input
              type="text"
              placeholder="مثال: بريد العمل، بريدي الأساسي"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* Submit Button */}
          <div style={{ gridColumn: 'span 2 / span 2', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <Plus size={20} />
              <span>{isSubmitting ? 'جاري الإضافة...' : '➕ حفظ وإضافة البريد إلى لوحتي'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. SAVED EMAILS LIST */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>قائمة البريدات المحفوظة</span>
            <span
              style={{
                fontSize: '0.8rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '2px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              {accounts.length}
            </span>
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            انسخ رابط أي بريد وأرسله لهاتفك
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Mail size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              لوحتك فارغة حالياً
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              أضف بريدك الأول في النموذج أعلاه لتوليد رابط مباشر لهاتفك بنقرة واحدة.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {accounts.map((acc) => {
              const isCopied = copiedId === acc.id;
              const status = liveEvents[acc.id];
              const showPass = showPasswordMap[acc.id];

              return (
                <div
                  key={acc.id}
                  className={`glass-panel ${status ? 'glass-panel-glow' : ''}`}
                  style={{
                    padding: '20px 22px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  {/* Info Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px', flex: 1 }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: acc.email.includes('gmail')
                          ? 'rgba(234, 67, 53, 0.15)'
                          : acc.email.includes('outlook')
                          ? 'rgba(0, 120, 212, 0.15)'
                          : 'rgba(6, 182, 212, 0.15)',
                        color: acc.email.includes('gmail')
                          ? '#ea4335'
                          : acc.email.includes('outlook')
                          ? '#38bdf8'
                          : '#06b6d4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Mail size={24} />
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                          {acc.label || 'حساب بريد'}
                        </span>

                        {/* Status Badge */}
                        {status === 'claimed' ? (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
                            ✓ تم إضافته بالهاتف
                          </span>
                        ) : status === 'opened' ? (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', fontWeight: 700 }}>
                            📱 مفتوح في الهاتف الآن
                          </span>
                        ) : null}
                      </div>

                      {/* Email Address */}
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                          direction: 'ltr',
                          textAlign: 'right',
                          fontFamily: 'var(--font-en)'
                        }}
                      >
                        {acc.email}
                      </div>

                      {/* Password if exists */}
                      {acc.password && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>الرمز:</span>
                          <span style={{ fontFamily: 'monospace', color: '#f8fafc' }}>
                            {showPass ? acc.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(acc.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                          >
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    
                    {/* The Big Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(acc)}
                      className="btn-primary"
                      style={{
                        padding: '10px 18px',
                        fontSize: '0.9rem',
                        background: isCopied ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : undefined
                      }}
                    >
                      {isCopied ? <Check size={18} /> : <Copy size={18} />}
                      <span>{isCopied ? 'تم نسخ الرابط!' : '📋 نسخ الرابط'}</span>
                    </button>

                    {/* WhatsApp Quick Share */}
                    <button
                      onClick={() => shareViaWhatsApp(acc)}
                      className="btn-secondary"
                      title="إرسال عبر واتساب"
                      style={{ padding: '10px 14px', background: 'rgba(37, 211, 102, 0.12)', borderColor: 'rgba(37, 211, 102, 0.25)', color: '#25d366' }}
                    >
                      <MessageCircle size={18} />
                    </button>

                    {/* Test Link in new tab */}
                    <a
                      href={getAccountLink(acc)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      title="تجربة فتح الرابط كما يظهر في الهاتف"
                      style={{ padding: '10px 14px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={18} />
                    </a>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="btn-secondary"
                      title="حذف من اللوحة"
                      style={{ padding: '10px 14px', color: '#ef4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supabase Settings Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={loadAccounts}
        showToast={showToast}
      />
    </div>
  );
}
