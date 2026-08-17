import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 22px',
        borderRadius: '16px',
        background: isSuccess
          ? 'rgba(16, 185, 129, 0.95)'
          : isError
          ? 'rgba(239, 68, 68, 0.95)'
          : 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(12px)',
        color: '#ffffff',
        boxShadow: isSuccess
          ? '0 10px 25px -5px rgba(16, 185, 129, 0.5)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontWeight: 600,
        fontSize: '0.95rem',
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '90vw'
      }}
    >
      {isSuccess && <CheckCircle2 size={20} />}
      {isError && <AlertCircle size={20} />}
      {!isSuccess && !isError && <Info size={20} />}
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
