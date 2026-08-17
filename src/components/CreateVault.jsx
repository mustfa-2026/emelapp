import React, { useState, useEffect } from 'react';
import {
  Mail,
  Link,
  Copy,
  Check,
  Share2,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { io } from 'socket.io-client';
import { encodeVaultPayload } from '../utils/crypto';
import { playClick, playPop, playSuccessChime, playAlert } from '../utils/sound';

const DOMAIN_SUGGESTIONS = ['@gmail.com', '@outlook.com', '@icloud.com', '@yahoo.com', '@hotmail.com'];

export default function CreateVault({ showToast }) {
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [vaultId, setVaultId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live status from socket: 'waiting' | 'opened' | 'claimed'
  const [liveStatus, setLiveStatus] = useState('waiting');
  const [socket, setSocket] = useState(null);

  // Setup Socket.io for live notifications
  useEffect(() => {
    let s;
    try {
      s = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3
      });

      s.on('connect', () => {
        console.log('Socket connected');
      });

      s.on('vault:opened', () => {
        playAlert();
        setLiveStatus('opened');
        showToast('📱 تم فتح الرابط على هاتفك الآن!', 'info');
      });

      s.on('vault:claimed', () => {
        playSuccessChime();
        setLiveStatus('claimed');
        showToast('🎉 تم إضافة البريد إلى هاتفك الثاني بنجاح!', 'success');
      });

      setSocket(s);
    } catch (err) {
      console.warn('Socket connection error', err);
    }

    return () => {
      if (s) s.disconnect();
    };
  }, []);

  // Handle smart domain chip click
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

  // Generate the vault link
  const handleCreateVault = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return;
    }

    setLoading(true);
    playClick();

    const payload = {
      email: email.trim(),
      label: label.trim() || 'حساب بريد',
      notes: notes.trim(),
      password: password.trim(),
      service: email.toLowerCase().includes('gmail')
        ? 'gmail'
        : email.toLowerCase().includes('outlook')
        ? 'outlook'
        : 'custom',
      ttlMinutes,
      selfDestruct
    };

    try {
      // 1. Try server API
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}/?v=${data.id}`;
        setVaultId(data.id);
        setGeneratedLink(fullUrl);
        setLiveStatus('waiting');

        // Join room
        if (socket && socket.connected) {
          socket.emit('join_vault', data.id);
        }

        playSuccessChime();
        showToast('تم إنشاء الرابط بنجاح! انسخه وأرسله لهاتفك', 'success');
      } else {
        throw new Error('Server API failed');
      }
    } catch (err) {
      // 2. Fallback to client-side encoded hash (works even offline)
      console.log('Using offline hash fallback', err);
      const encoded = encodeVaultPayload(payload);
      const fullUrl = `${window.location.origin}/#vault=${encoded}`;
      setGeneratedLink(fullUrl);
      setLiveStatus('waiting');
      playSuccessChime();
      showToast('تم إنشاء الرابط بنجاح! انسخه وأرسله لهاتفك', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    playPop();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedLink);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = generatedLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopiedLink(true);
      showToast('تم نسخ الرابط إلى الحافظة! 📋', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  const shareViaWhatsApp = () => {
    playClick();
    const text = encodeURIComponent(`افتح هذا الرابط لإضافة البريد الإلكتروني إلى هاتفك فوراً:\n${generatedLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareViaTelegram = () => {
    playClick();
    const text = encodeURIComponent('إضافة البريد الإلكتروني إلى الهاتف بنقرة واحدة');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${text}`, '_blank');
  };

  const handleReset = () => {
    playClick();
    setGeneratedLink('');
    setVaultId(null);
    setLiveStatus('waiting');
    setEmail('');
    setLabel('');
    setPassword('');
    setNotes('');
  };

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '0 16px 40px 16px' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px 28px', position: 'relative' }}>
        
        {/* Header Intro */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '14px'
            }}
          >
            <Sparkles size={16} />
            <span>نقل مباشر فائق السهولة</span>
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>
            أدخل البريد وأرسل الرابط لهاتفك
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            بمجرد فتح الرابط على هاتفك الثاني والنقر على "موافق"، يُضاف البريد فوراً لحسابك وجهازك.
          </p>
        </div>

        {!generatedLink ? (
          /* FORM VIEW */
          <form onSubmit={handleCreateVault} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Email Input Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: '#f8fafc'
                }}
              >
                البريد الإلكتروني <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="مثال: yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  dir="ltr"
                  style={{ textAlign: 'left', paddingLeft: '44px', fontFamily: 'var(--font-en)' }}
                />
                <Mail
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>

              {/* Fast Domain Completion Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {DOMAIN_SUGGESTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDomainChip(d)}
                    className="provider-chip"
                    style={{ fontFamily: 'var(--font-en)', direction: 'ltr' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Label / Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: 'var(--text-secondary)'
                }}
              >
                اسم الحساب أو المسمى (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثال: بريدي الشخصي، حساب العمل"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="glass-input"
              />
            </div>

            {/* Advanced Options Accordion */}
            <div
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                background: 'rgba(10, 16, 28, 0.4)',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowAdvanced(!showAdvanced);
                }}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--accent-cyan)" />
                  <span>خيارات متقدمة وكلمة المرور (للمطورين)</span>
                </div>
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showAdvanced && (
                <div style={{ padding: '0 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        marginBottom: '6px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      كلمة مرور الحساب أو رمز التطبيق (App Password)
                    </label>
                    <input
                      type="text"
                      placeholder="اختياري - لنقل كلمة المرور بشكل مشفر مع البريد"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        marginBottom: '6px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      ملاحظات أو تعليمات إضافية
                    </label>
                    <textarea
                      rows={2}
                      placeholder="مثال: استخدم منفذ IMAP 993..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="glass-input"
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>مدة صلاحية الرابط:</span>
                    </div>
                    <select
                      value={ttlMinutes}
                      onChange={(e) => setTtlMinutes(Number(e.target.value))}
                      className="glass-input"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <option value={15} style={{ background: '#0f172a' }}>15 دقيقة</option>
                      <option value={60} style={{ background: '#0f172a' }}>ساعة واحدة</option>
                      <option value={1440} style={{ background: '#0f172a' }}>24 ساعة</option>
                    </select>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selfDestruct}
                      onChange={(e) => setSelfDestruct(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                    />
                    <span>تدمير الرابط ذاتياً وحذفه فور فتحه واستلامه على الهاتف 💣</span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', fontSize: '1.1rem', marginTop: '6px' }}
            >
              <Link size={20} />
              <span>{loading ? 'جاري إنشاء الرابط المشفر...' : '⚡ إنشاء الرابط السريع'}</span>
            </button>
          </form>
        ) : (
          /* RESULT VIEW: GENERATED LINK & LIVE MONITOR */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
            
            <div
              style={{
                background: 'rgba(10, 16, 28, 0.8)',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '18px',
                padding: '20px 16px',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                رابط مشاركة البريد ({email}):
              </span>

              {/* Copyable Link Input Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '14px'
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  dir="ltr"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontFamily: 'var(--font-en)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    userSelect: 'all'
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedLink ? 'تم النسخ!' : 'نسخ'}</span>
                </button>
              </div>

              {/* Quick Share Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={shareViaWhatsApp}
                  className="btn-secondary"
                  style={{ background: 'rgba(37, 211, 102, 0.15)', borderColor: 'rgba(37, 211, 102, 0.3)', color: '#25d366' }}
                >
                  <MessageCircle size={18} />
                  <span>واتساب</span>
                </button>

                <button
                  onClick={shareViaTelegram}
                  className="btn-secondary"
                  style={{ background: 'rgba(0, 136, 204, 0.15)', borderColor: 'rgba(0, 136, 204, 0.3)', color: '#0088cc' }}
                >
                  <Send size={18} />
                  <span>تيليجرام</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="btn-secondary"
                >
                  <Copy size={18} />
                  <span>نسخ الرابط</span>
                </button>
              </div>
            </div>

            {/* LIVE PULSE STATUS MONITOR */}
            <div
              style={{
                borderRadius: '16px',
                padding: '16px 20px',
                background: liveStatus === 'claimed'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : liveStatus === 'opened'
                  ? 'rgba(6, 182, 212, 0.12)'
                  : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${
                  liveStatus === 'claimed'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : liveStatus === 'opened'
                    ? 'rgba(6, 182, 212, 0.3)'
                    : 'rgba(245, 158, 11, 0.2)'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                className={`status-beacon ${
                  liveStatus === 'claimed' ? 'success' : liveStatus === 'opened' ? 'connected' : 'waiting'
                }`}
              />

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                  {liveStatus === 'claimed' && '🎉 تم إضافة البريد إلى الهاتف بنجاح!'}
                  {liveStatus === 'opened' && '📱 الهاتف متصل الآن وفتح الرابط...'}
                  {liveStatus === 'waiting' && '📡 في انتظار فتح الرابط على هاتفك الثاني...'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {liveStatus === 'claimed' && 'تم استلام وتأكيد إضافة الحساب على جهازك الثاني.'}
                  {liveStatus === 'opened' && 'المستلم يشاهد الشاشة حالياً على الهاتف.'}
                  {liveStatus === 'waiting' && 'أرسل الرابط أعلاه لهاتفك عبر واتساب أو تيليجرام أو رسالة وافتحه.'}
                </p>
              </div>
            </div>

            {/* Reset / Create another button */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleReset}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                إنشاء رابط لبريد آخر
              </button>

              {/* Direct Open Test in new tab */}
              <a
                href={generatedLink}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                <ExternalLink size={16} />
                <span>تجربة الرابط</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
