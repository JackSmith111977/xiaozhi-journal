'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: '#FDF8F5',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <h1 style={{ fontSize: '2rem', color: '#3D3D3D', marginBottom: '0.75rem', fontFamily: 'var(--font-noto-serif, serif)' }}>
              服务异常
            </h1>
            <p style={{ color: '#8A817C', marginBottom: '2rem' }}>
              应用加载失败，请稍后重试。
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 2rem',
                background: '#D4856A',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
