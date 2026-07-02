/**
 * ChatbotWidget.tsx
 * Floating chat widget — muncul di semua halaman setelah login.
 * Glassmorphism design, responsive (mobile fullscreen, desktop popup).
 */

'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChatbot, type PesanChat } from '@/hooks/useChatbot';

// ═══════════════════════════════════
// QUICK ACTION CHIPS
// ═══════════════════════════════════
const QUICK_ACTIONS = [
  { label: '📦 Stok rendah?', pesan: 'Produk apa saja yang stoknya rendah atau habis?' },
  { label: '💰 Penjualan hari ini', pesan: 'Berapa total penjualan hari ini?' },
  { label: '📊 Ringkasan toko', pesan: 'Tampilkan statistik lengkap toko saat ini' },
  { label: '🏆 Produk terlaris', pesan: 'Apa 10 produk terlaris bulan ini?' },
  { label: '⏰ Kadaluarsa?', pesan: 'Ada produk yang sudah atau mendekati kadaluarsa?' },
  { label: '📂 Daftar kategori', pesan: 'Tampilkan semua kategori produk' },
];

// ═══════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════
export default function ChatbotWidget() {
  const {
    pesanList,
    sedangMemuat,
    isOpen,
    kirimPesan,
    konfirmasiAksi,
    batalAksi,
    bersihkanRiwayat,
    toggleOpen,
    setIsOpen,
  } = useChatbot();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pesanList, sedangMemuat]);

  // Focus input saat panel dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle send
  const handleSend = async () => {
    if (!inputText.trim() || sedangMemuat) return;
    const text = inputText;
    setInputText('');
    await kirimPesan(text);
  };

  // Handle Enter key (Shift+Enter untuk newline)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle quick action
  const handleQuickAction = (pesan: string) => {
    kirimPesan(pesan);
  };

  // Auto-resize textarea
  const handleInputChange = (value: string) => {
    setInputText(value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + 'px';
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════ */}
      {/* FAB Button                         */}
      {/* ═══════════════════════════════════ */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          id="chatbot-fab"
          aria-label="Buka Asisten Tokiva"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-gradient)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(13, 148, 136, 0.4)',
            zIndex: 1000,
            transition: 'transform var(--transition), box-shadow var(--transition)',
            animation: 'chatbot-pulse 2s ease-in-out infinite',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(13, 148, 136, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(13, 148, 136, 0.4)';
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7v1a7 7 0 0 1-7 7H7l-4 4V9a7 7 0 0 1 7-7z" fill="rgba(255,255,255,0.2)" />
            <circle cx="9" cy="10" r="1" fill="white" />
            <circle cx="12" cy="10" r="1" fill="white" />
            <circle cx="15" cy="10" r="1" fill="white" />
          </svg>
        </button>
      )}

      {/* ═══════════════════════════════════ */}
      {/* Chat Panel                         */}
      {/* ═══════════════════════════════════ */}
      {isOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 1000,
              display: 'none',
            }}
            className="lg:!hidden chatbot-backdrop"
          />

          <div
            ref={panelRef}
            id="chatbot-panel"
            style={{
              position: 'fixed',
              bottom: '0',
              right: '0',
              width: '100%',
              height: '100dvh',
              background: 'var(--bg)',
              borderRadius: '0',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'chatbot-slide-up 0.3s ease',
            }}
            className="lg:!bottom-[20px] lg:!right-[20px] lg:!w-[400px] lg:!h-[560px] lg:!rounded-[var(--radius-xl)] lg:!animate-none"
          >
            {/* ── Header ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'var(--primary-gradient)',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                  }}
                >
                  🤖
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Asisten Tokiva</div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>
                    {sedangMemuat ? 'Mengetik...' : 'Online — siap membantu'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Clear chat button */}
                {pesanList.length > 0 && (
                  <button
                    onClick={bersihkanRiwayat}
                    title="Hapus riwayat chat"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6" /><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                    </svg>
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Tutup chat"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Welcome message + Quick actions jika kosong */}
              {pesanList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏪</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Halo! Saya Asisten Tokiva
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Saya bisa membantu mengelola toko Anda. Coba tanya soal stok, penjualan, atau kelola produk via chat!
                  </p>

                  {/* Quick Action Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {QUICK_ACTIONS.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => handleQuickAction(qa.pesan)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--primary)';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--surface)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {pesanList.map((pesan) => (
                <MessageBubble
                  key={pesan.id}
                  pesan={pesan}
                  onKonfirmasi={konfirmasiAksi}
                  onBatal={batalAksi}
                  sedangMemuat={sedangMemuat}
                />
              ))}

              {/* Typing indicator */}
              {sedangMemuat && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    🤖
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '4px var(--radius-lg) var(--radius-lg) var(--radius-lg)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                    }}
                  >
                    <span className="chatbot-dot" style={{ animationDelay: '0ms' }} />
                    <span className="chatbot-dot" style={{ animationDelay: '150ms' }} />
                    <span className="chatbot-dot" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                rows={1}
                disabled={sedangMemuat}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '10px 14px',
                  fontSize: '14px',
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  lineHeight: 1.4,
                  maxHeight: '100px',
                  transition: 'border-color var(--transition-fast)',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />

              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sedangMemuat}
                aria-label="Kirim pesan"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  background: inputText.trim() && !sedangMemuat ? 'var(--primary-gradient)' : 'var(--border)',
                  border: 'none',
                  cursor: inputText.trim() && !sedangMemuat ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                  transition: 'background var(--transition-fast), transform var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (inputText.trim() && !sedangMemuat) e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════ */}
      {/* CSS Animations                     */}
      {/* ═══════════════════════════════════ */}
      <style jsx global>{`
        @keyframes chatbot-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(13, 148, 136, 0.4); }
          50% { box-shadow: 0 4px 30px rgba(13, 148, 136, 0.6); }
        }

        @keyframes chatbot-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes chatbot-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        .chatbot-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-tertiary);
          animation: chatbot-dot-bounce 1.2s ease-in-out infinite;
          display: inline-block;
        }

        .chatbot-backdrop {
          display: block !important;
        }

        @media (min-width: 1024px) {
          .chatbot-backdrop {
            display: none !important;
          }

          #chatbot-panel {
            bottom: 20px !important;
            right: 20px !important;
            width: 400px !important;
            height: 560px !important;
            border-radius: var(--radius-xl) !important;
            animation: chatbot-fade-in 0.2s ease !important;
          }

          #chatbot-fab {
            bottom: 24px !important;
          }

          @keyframes chatbot-fade-in {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════
// FORMATTED MARKDOWN-LIKE RENDERER
// ═══════════════════════════════════
function renderFormattedContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Check if bullet point
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const cleanLine = line.replace(/^[\s-*]+/, '');
      return (
        <div key={idx} className="flex gap-1.5 ml-2 my-0.5" style={{ color: 'inherit' }}>
          <span style={{ color: 'var(--primary)' }}>•</span>
          <span>{cleanLine}</span>
        </div>
      );
    }
    // Check if bold markdown **text**
    if (line.includes('**')) {
      const parts = line.split('**');
      return (
        <p key={idx} className="my-0.5" style={{ color: 'inherit' }}>
          {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-zinc-900 dark:text-zinc-50">{part}</strong> : part)}
        </p>
      );
    }
    // Regular line
    return <p key={idx} className="my-0.5" style={{ color: 'inherit' }}>{line}</p>;
  });
}

// ═══════════════════════════════════
// MESSAGE BUBBLE COMPONENT
// ═══════════════════════════════════
function MessageBubble({
  pesan,
  onKonfirmasi,
  onBatal,
  sedangMemuat,
}: {
  pesan: PesanChat;
  onKonfirmasi: (id: string) => void;
  onBatal: (id: string) => void;
  sedangMemuat: boolean;
}) {
  const isUser = pesan.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '8px',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          🤖
        </div>
      )}

      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Message content */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isUser
              ? 'var(--radius-lg) 4px var(--radius-lg) var(--radius-lg)'
              : '4px var(--radius-lg) var(--radius-lg) var(--radius-lg)',
            background: isUser ? 'var(--primary)' : 'var(--surface)',
            color: isUser ? 'white' : 'var(--text-primary)',
            border: isUser ? 'none' : '1px solid var(--border)',
            fontSize: '13px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {isUser ? pesan.konten : renderFormattedContent(pesan.konten)}
        </div>

        {/* Confirmation card */}
        {pesan.konfirmasi && pesan.konfirmasi.status === 'pending' && (
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <p className="text-[11px] font-bold text-center text-zinc-500 uppercase tracking-wider">Persetujuan Aksi</p>
            <div className="flex gap-2">
              <button
                onClick={() => onKonfirmasi(pesan.konfirmasi!.aksiId)}
                disabled={sedangMemuat}
                className="hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--success)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: sedangMemuat ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: sedangMemuat ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                👍 Setuju
              </button>
              <button
                onClick={() => onBatal(pesan.konfirmasi!.aksiId)}
                disabled={sedangMemuat}
                className="hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: sedangMemuat ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: sedangMemuat ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                👎 Tidak
              </button>
            </div>
          </div>
        )}

        {/* Confirmation status badge */}
        {pesan.konfirmasi && pesan.konfirmasi.status === 'confirmed' && (
          <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600, paddingLeft: '4px' }}>
            👍 Disetujui
          </div>
        )}
        {pesan.konfirmasi && pesan.konfirmasi.status === 'cancelled' && (
          <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, paddingLeft: '4px' }}>
            👎 Dibatalkan
          </div>
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-tertiary)',
            textAlign: isUser ? 'right' : 'left',
            paddingLeft: isUser ? 0 : '2px',
            paddingRight: isUser ? '2px' : 0,
          }}
        >
          {pesan.waktu}
        </div>
      </div>
    </div>
  );
}
