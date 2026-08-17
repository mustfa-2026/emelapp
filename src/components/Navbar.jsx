import React from 'react';
import { ShieldCheck, Mail, Sparkles, RefreshCw } from 'lucide-react';
import { playClick } from '../utils/sound';

export default function Navbar({ onReset, isReceiving }) {
  return (
    <header
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div
        onClick={() => {
          playClick();
          if (onReset) onReset();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px -4px rgba(6, 182, 212, 0.5)',
            color: '#fff'
          }}
        >
          <Mail size={22} />
        </div>
        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            خزنة المستخدم
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              Vault
            </span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            نقل وإضافة البريد للهاتف بنقرة واحدة
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          <ShieldCheck size={15} />
          <span>تشفير مباشر وآمن</span>
        </div>

        {isReceiving && (
          <button
            onClick={() => {
              playClick();
              if (onReset) onReset();
            }}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
            <span>إنشاء رابط جديد</span>
          </button>
        )}
      </div>
    </header>
  );
}
