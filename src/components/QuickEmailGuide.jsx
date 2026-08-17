import React, { useState } from 'react';
import { Smartphone, Check, HelpCircle, ChevronDown, ChevronUp, Copy, Mail, UserPlus } from 'lucide-react';
import { playClick } from '../utils/sound';

export default function QuickEmailGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceTab, setDeviceTab] = useState('ios'); // 'ios' | 'android'

  return (
    <div
      style={{
        marginTop: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.4)',
        overflow: 'hidden'
      }}
    >
      <button
        onClick={() => {
          playClick();
          setIsOpen(!isOpen);
        }}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: 600
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={18} color="var(--accent-cyan)" />
          <span>كيف تعمل الإضافة بنقرة واحدة على هاتفك؟</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div style={{ padding: '0 20px 20px 20px' }}>
          {/* Device Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '10px'
            }}
          >
            <button
              onClick={() => {
                playClick();
                setDeviceTab('ios');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: 'none',
                background: deviceTab === 'ios' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: deviceTab === 'ios' ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🍎 آيفون (iPhone / iOS)
            </button>
            <button
              onClick={() => {
                playClick();
                setDeviceTab('android');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: 'none',
                background: deviceTab === 'android' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: deviceTab === 'android' ? '#34d399' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🤖 أندرويد (Android / Samsung)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  flexShrink: 0
                }}
              >
                <UserPlus size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
                  1. الإضافة لجهات الاتصال والحساب (VCF)
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {deviceTab === 'ios'
                    ? 'عند النقر على زر الإضافة، يفتح نظام iOS جهة اتصال جديدة جاهزة، اضغط على "حفظ" لتنضاف فوراً لجهاتك وحسابك.'
                    : 'عند النقر على زر الإضافة، يفتح نظام أندرويد نافذة "إضافة إلى جهات الاتصال"، اضغط "حفظ".'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  flexShrink: 0
                }}
              >
                <Copy size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
                  2. النسخ الفوري للحافظة
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  يتم نسخ البريد الإلكتروني تلقائياً إلى حافظة هاتفك حتى تتمكن من لصقه فوراً في أي تطبيق (Gmail, Outlook, Settings).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                  flexShrink: 0
                }}
              >
                <Mail size={16} />
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>
                  3. فتح تطبيق البريد بنقرة
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  يمكنك فتح تطبيق البريد الافتراضي في هاتفك بضغطة زر واحدة والبريد معبأ مسبقاً.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
