import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ReceiveVault from './components/ReceiveVault';
import Toast from './components/Toast';
import { decodeVaultPayload } from './utils/crypto';
import { dbGetVault, isSupabaseConfigured } from './utils/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [vaultData, setVaultData] = useState(null);
  const [vaultId, setVaultId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const checkUrlForVault = async () => {
    setLoading(true);
    setError(null);

    // 1. Check query parameter ?v=ID
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('v');

    // 2. Check hash parameter #vault=ENCODED
    const hash = window.location.hash;
    let hashPayload = null;
    if (hash && hash.includes('vault=')) {
      const match = hash.match(/vault=([^&]+)/);
      if (match && match[1]) {
        hashPayload = decodeVaultPayload(match[1]);
      }
    }

    if (id) {
      setVaultId(id);
      let foundData = null;

      // 1. Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          foundData = await dbGetVault(id);
        } catch (e) {
          console.warn('Supabase get error', e);
        }
      }

      // 2. Try Local Server fallback if not found in Supabase
      if (!foundData) {
        try {
          const res = await fetch(`/api/vault/${id}`);
          if (res.ok) {
            foundData = await res.json();
          }
        } catch (err) {}
      }

      // 3. Try LocalStorage fallback
      if (!foundData) {
        try {
          const local = localStorage.getItem('uservault_personal_accounts_v1');
          if (local) {
            const list = JSON.parse(local);
            foundData = list.find((item) => item.id === id);
          }
        } catch (e) {}
      }

      if (foundData) {
        setVaultData(foundData);
      } else {
        setError('الرابط غير موجود أو تم حذفه');
      }
    } else if (hashPayload) {
      setVaultData(hashPayload);
      setVaultId(null);
    } else {
      setVaultData(null);
      setVaultId(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkUrlForVault();

    window.addEventListener('popstate', checkUrlForVault);
    window.addEventListener('hashchange', checkUrlForVault);
    return () => {
      window.removeEventListener('popstate', checkUrlForVault);
      window.removeEventListener('hashchange', checkUrlForVault);
    };
  }, []);

  const handleReset = () => {
    window.history.pushState({}, '', window.location.pathname);
    setVaultData(null);
    setVaultId(null);
    setError(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ambient background glows */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Navigation */}
      <Navbar onReset={handleReset} isReceiving={Boolean(vaultData || error)} />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '20px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(56, 189, 248, 0.2)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px auto'
              }}
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>جاري التحميل...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px' }} className="animate-fade-in">
            <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px auto',
                  color: '#ef4444'
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#fff' }}>
                الرابط غير متاح
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                {error}
              </p>
              <button onClick={handleReset} className="btn-primary" style={{ width: '100%' }}>
                <RefreshCw size={18} />
                <span>العودة للوحة التحكم</span>
              </button>
            </div>
          </div>
        ) : vaultData ? (
          <ReceiveVault vaultData={vaultData} vaultId={vaultId} showToast={showToast} />
        ) : (
          <Dashboard showToast={showToast} />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          position: 'relative',
          zIndex: 1
        }}
      >
        <p>خزنة المستخدم (UserVault) — لوحة إدارة ونقل البريدات الخاصة بك بنقرة واحدة</p>
      </footer>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
