"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What should I watch next?",
  "What's trending in anime right now?",
  "Catch me up on recent anime news",
  "Recommend something like Attack on Titan",
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Add empty assistant message for streaming
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulated += parsed.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: accumulated,
                      streaming: true,
                    };
                    return updated;
                  });
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        }
      }

      // Mark streaming done
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: accumulated,
          streaming: false,
        };
        return updated;
      });
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't connect to the AI service. Please try again.",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9000,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "hsl(var(--primary))",
          border: "none",
          cursor: "pointer",
          display: open ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px hsl(var(--primary) / 0.4)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 6px 24px hsl(var(--primary) / 0.6)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 4px 20px hsl(var(--primary) / 0.4)";
        }}
        aria-label="Open Hakken AI"
      >
        <Sparkles style={{
          width: "22px", height: "22px",
          color: "white",
        }} />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 9000,
              width: "360px",
              maxWidth: "calc(100vw - 48px)",
              height: "520px",
              maxHeight: "calc(100vh - 80px)",
              display: "flex",
              flexDirection: "column",
              background: "var(--glass-bg)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1.5px solid var(--glass-border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid var(--glass-border)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px"
              }}>
                <Sparkles style={{
                  width: "16px", height: "16px",
                  color: "hsl(var(--primary))",
                }} />
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "14px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "hsl(var(--foreground))",
                }}>
                  Hakken AI
                </span>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "hsl(var(--primary))",
                  background: "hsl(var(--primary) / 0.1)",
                  padding: "2px 6px",
                }}>
                  Beta
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", padding: "4px",
                  color: "hsl(var(--muted-foreground))",
                  display: "flex", alignItems: "center",
                }}
                aria-label="Close chat"
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "16px", display: "flex",
              flexDirection: "column", gap: "12px",
            }}>
              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ textAlign: "center", paddingTop: "16px" }}>
                    <Sparkles style={{
                      width: "28px", height: "28px",
                      color: "hsl(var(--primary))",
                      margin: "0 auto 8px",
                      display: "block",
                    }} />
                    <p style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "13px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "hsl(var(--foreground))",
                      margin: "0 0 4px",
                    }}>
                      Ask me anything about anime
                    </p>
                    <p style={{
                      fontSize: "12px",
                      color: "hsl(var(--muted-foreground))",
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                      I know your watchlist and the latest news
                    </p>
                  </div>

                  {/* Suggested prompts */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: "6px"
                  }}>
                    {SUGGESTED_PROMPTS.map(p => (
                      <button
                        key={p}
                        onClick={() => sendMessage(p)}
                        style={{
                          background: "hsl(var(--foreground) / 0.04)",
                          border: "1px solid var(--glass-border)",
                          padding: "8px 12px",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                          transition: "all 0.15s",
                          borderRadius: 0,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background =
                            "hsl(var(--primary) / 0.08)";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "hsl(var(--primary) / 0.3)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background =
                            "hsl(var(--foreground) / 0.04)";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--glass-border)";
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user"
                      ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "85%",
                    padding: "10px 12px",
                    background: msg.role === "user"
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground) / 0.06)",
                    border: msg.role === "assistant"
                      ? "1px solid var(--glass-border)"
                      : "none",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: msg.role === "user"
                      ? "hsl(var(--primary-foreground))"
                      : "hsl(var(--foreground))",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {msg.content}
                    {msg.streaming && (
                      <span style={{
                        display: "inline-block",
                        width: "6px", height: "14px",
                        background: "hsl(var(--primary))",
                        marginLeft: "2px",
                        animation: "blink 1s infinite",
                      }} />
                    )}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.content === "" && (
                <div style={{ display: "flex", gap: "4px", padding: "4px 0" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: "6px", height: "6px",
                      borderRadius: "50%",
                      background: "hsl(var(--primary))",
                      animation: `bounce 1s infinite ${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "12px",
              borderTop: "1px solid var(--glass-border)",
              display: "flex", gap: "8px", alignItems: "center",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about anime..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: "hsl(var(--foreground) / 0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 0,
                  padding: "8px 12px",
                  fontSize: "13px",
                  color: "hsl(var(--foreground))",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                onFocus={e => {
                  (e.target as HTMLElement).style.borderColor =
                    "hsl(var(--primary) / 0.5)";
                }}
                onBlur={e => {
                  (e.target as HTMLElement).style.borderColor =
                    "var(--glass-border)";
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: "36px", height: "36px",
                  background: "hsl(var(--primary))",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: input.trim() && !loading ? 1 : 0.5,
                  flexShrink: 0,
                  transition: "opacity 0.15s",
                }}
                aria-label="Send message"
              >
                {loading
                  ? <Loader2 style={{
                      width: "16px", height: "16px",
                      color: "white", animation: "spin 1s linear infinite",
                    }} />
                  : <Send style={{ width: "14px", height: "14px", color: "white" }} />
                }
              </button>
            </div>

            {/* CSS animations */}
            <style>{`
              @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
              }
              @keyframes bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-6px); }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
