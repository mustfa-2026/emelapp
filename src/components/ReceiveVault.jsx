import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mail, Check, Eye, EyeOff, Copy } from 'lucide-react';
import { addEmailToPhone, copyText } from '../utils/vcard';
import { playSuccessChime, playPop } from '../utils/sound';
import { dbClaimVault, isSupabaseConfigured } from '../utils/supabase';

export default function ReceiveVault({ vaultData, vaultId, showToast }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const { email, label, password } = vaultData;

  // Notify server that receiver opened the link
  useEffect(() => {
    if (vaultId) {
      fetch(`/api/vault/${vaultId}`).catch(() => {});
    }
  }, [vaultId]);

  // ── THE ONE TAP: "موافق" ──
  const handleApprove = async () => {
    playSuccessChime();

    // 1. Copy email + password to clipboard FIRST
    const clipText = password ? `${email}\n${password}` : email;
    await copyText(clipText);

    // 2. Confetti (visual feedback before navigation)
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    // 3. Notify sender (Supabase + local server) BEFORE navigating away
    if (vaultId) {
      const promises = [];
      if (isSupabaseConfigured()) {
        promises.push(dbClaimVault(vaultId).catch(() => {}));
      }
      promises.push(
        fetch(`/api/vault/${vaultId}/claim`, { method: 'POST' }).catch(() => {})
      );
      // Wait briefly for notifications to send
      await Promise.race([
        Promise.all(promises),
        new Promise(r => setTimeout(r, 800)) // max 800ms wait
      ]);
    }

    // 4. Navigate to server-served VCF → phone OS opens native Contacts app
    addEmailToPhone(email, label || 'بريد');
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
      <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>

        {/* Email Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', boxShadow: '0 12px 25px -5px rgba(6,182,212,.5)'
        }}>
          <Mail size={32} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          إضافة البريد الإلكتروني
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.95rem', marginBottom: 24 }}>
          انقر "موافق" وسيُضاف البريد مباشرة لجهات اتصال هاتفك
        </p>

        {/* Email Card */}
        <div style={{
          background: 'rgba(10,16,28,.85)', border: '1.5px solid rgba(56,189,248,.3)',
          borderRadius: 18, padding: '20px 16px', marginBottom: 28,
          boxShadow: '0 10px 30px -10px rgba(0,0,0,.5)'
        }}>
          {label && (
            <span style={{ display: 'block', fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>
              {label}
            </span>
          )}

          <div style={{
            fontSize: '1.4rem', fontWeight: 800, color: '#fff',
            wordBreak: 'break-all', direction: 'ltr', textAlign: 'center',
            fontFamily: 'var(--font-en)'
          }}>
            {email}
          </div>

          {password && (
            <div style={{
              marginTop: 14, paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '.9rem'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>كلمة المرور:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                  {showPassword ? password : '••••••••'}
                </span>
                <button onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={handleCopyPass}
                  style={{ background: 'none', border: 'none', color: copiedPass ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                  {copiedPass ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BIG "موافق" BUTTON */}
        <button onClick={handleApprove} className="btn-success" style={{
          width: '100%', fontSize: '1.4rem', padding: 22,
          boxShadow: '0 12px 30px -5px rgba(16,185,129,.5)'
        }}>
          <Check size={28} strokeWidth={3} />
          <span>موافق</span>
        </button>

        <p style={{ marginTop: 16, fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          سيتم نسخ البريد{password ? ' وكلمة المرور' : ''} للحافظة تلقائياً وفتح جهات الاتصال لحفظه.
        </p>

      </div>
    </div>
  );
}
