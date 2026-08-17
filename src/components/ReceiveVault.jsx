import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mail, Check, Eye, EyeOff, Copy, Sparkles, CheckCircle2 } from 'lucide-react';
import { copyText } from '../utils/vcard';
import { playSuccessChime, playPop } from '../utils/sound';
import { dbClaimVault, isSupabaseConfigured } from '../utils/supabase';

export default function ReceiveVault({ vaultData, vaultId, showToast }) {
  const [isDone, setIsDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const { email, label, password } = vaultData;

  // Auto-notify server that receiver opened the link
  useEffect(() => {
    if (vaultId) {
      fetch(`/api/vault/${vaultId}`).catch(() => {});
    }
  }, [vaultId]);

  // ── THE ZERO-FRICTION ACTION: CLICK "موافق" ──
  const handleApprove = async () => {
    playSuccessChime();

    // 1. Instantly copy the email to phone clipboard
    await copyText(email);

    // 2. Trigger native contact card save silently in a hidden iframe (NO page navigation)
    try {
      const params = new URLSearchParams({
        email: email.trim(),
        name: (label || 'بريد').trim()
      });
      const downloadUrl = `/.netlify/functions/contact?${params.toString()}`;
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 3000);
    } catch (e) {}

    // 3. Fire celebratory Confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // 4. Update UI in-place (no page refresh, no redirection)
    setIsDone(true);
    if (showToast) {
      showToast('تم نسخ وإضافة البريد بنجاح! 🎉', 'success');
    }

    // 5. Notify Supabase + sender's dashboard
    if (vaultId) {
      if (isSupabaseConfigured()) {
        dbClaimVault(vaultId).catch(() => {});
      }
      fetch(`/api/vault/${vaultId}/claim`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleCopyPass = async () => {
    playPop();
    if (!password) return;
    await copyText(password);
    setCopiedPass(true);
    if (showToast) showToast('تم نسخ كلمة المرور 📋', 'success');
    setTimeout(() => setCopiedPass(false), 2500);
  };

  return (
    <div style={{ maxWidth: '460px', margin: '0 auto', padding: '0 16px 40px', width: '100%' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', position: 'relative' }}>

        {!isDone ? (
          /* ─── INITIAL SCREEN: Email + Single "موافق" Button ─── */
          <div className="animate-fade-in">
            {/* Mail Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 12px 25px -5px rgba(6, 182, 212, 0.5)'
              }}
            >
              <Mail size={32} />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
              إضافة البريد الإلكتروني
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
              انقر على "موافق" لإضافة البريد فوراً إلى هاتفك
            </p>

            {/* Email Card */}
            <div
              style={{
                background: 'rgba(10, 16, 28, 0.85)',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '18px',
                padding: '20px 16px',
                marginBottom: '28px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
              }}
            >
              {label && (
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                  {label}
                </span>
              )}

              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  wordBreak: 'break-all',
                  direction: 'ltr',
                  textAlign: 'center',
                  fontFamily: 'var(--font-en)'
                }}
              >
                {email}
              </div>

              {password && (
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>كلمة المرور:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                      {showPassword ? password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={handleCopyPass}
                      style={{ background: 'none', border: 'none', color: copiedPass ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="نسخ كلمة المرور"
                    >
                      {copiedPass ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* THE ONLY BUTTON: "موافق" */}
            <button
              onClick={handleApprove}
              className="btn-success"
              style={{
                width: '100%',
                fontSize: '1.4rem',
                padding: '22px',
                letterSpacing: '0.02em',
                boxShadow: '0 12px 30px -5px rgba(16, 185, 129, 0.5)'
              }}
            >
              <Check size={28} strokeWidth={3} />
              <span>موافق</span>
            </button>
          </div>
        ) : (
          /* ─── SUCCESS STATE IN THE EXACT SAME SCREEN: "تم ✓" ─── */
          <div className="animate-fade-in" style={{ padding: '15px 0' }}>
            {/* Glowing Green Checkmark Circle */}
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)',
                animation: 'pulse-slow 2s ease-in-out infinite'
              }}
            >
              <Check size={56} strokeWidth={3.5} />
            </div>

            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981', marginBottom: '8px' }}>
              تم !
            </h2>

            <p style={{ color: '#f8fafc', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>
              تمت إضافة ونسخ البريد بنجاح
            </p>

            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>البريد الإلكتروني موجود في حافظة هاتفك الآن</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
