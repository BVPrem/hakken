"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "plan_to_watch", label: "Plan to Watch" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
];

interface WatchlistButtonProps {
  seriesId: string;
}

export function WatchlistButton({ seriesId }: WatchlistButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/user/series?seriesId=${seriesId}`)
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.entry?.status ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seriesId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = async (newStatus: string) => {
    setSaving(true);
    try {
      await fetch("/api/user/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId, status: newStatus }),
      });
      setStatus(newStatus);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await fetch(`/api/user/series?seriesId=${seriesId}`, {
        method: "DELETE",
      });
      setStatus(null);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  const currentLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label;

  return (
    <div className="relative mt-2" ref={menuRef}>
      <button 
        className={cn(
          "w-full md:w-auto px-5 py-3 flex items-center justify-center gap-2",
          "border-4 border-foreground font-display uppercase tracking-widest text-base md:text-lg transition-transform",
          status ? "bg-primary text-primary-foreground" : "bg-background text-foreground halftone",
          !saving && "active:translate-x-[2px] active:translate-y-[2px]"
        )}
        style={{ boxShadow: saving ? 'none' : '4px 4px 0 hsl(var(--foreground))' }}
        disabled={saving}
        onClick={() => !saving && setOpen(!open)}
      >
        {saving ? (
           <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin" />
        ) : status ? (
          <Check className="w-5 h-5" strokeWidth={3} />
        ) : (
          <Plus className="w-5 h-5" strokeWidth={3} />
        )}
        <span className="mt-0.5">{status ? currentLabel : "Add to List"}</span>
      </button>

      {open && (
        <div className="absolute top-14 left-0 w-64 bg-background border-4 border-foreground z-50 overflow-hidden"
             style={{ boxShadow: "6px 6px 0 hsl(var(--foreground))" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 border-b-2 border-foreground/10",
                "text-left hover:bg-muted font-display tracking-widest uppercase transition-colors text-sm",
                status === opt.value ? "text-primary bg-primary/5" : "text-foreground"
              )}
            >
              {status === opt.value ? <Check className="w-4 h-4 text-primary" strokeWidth={3} /> : <div className="w-4 h-4" />}
              <span className="mt-0.5">{opt.label}</span>
            </button>
          ))}
          {status && (
            <button
              onClick={handleRemove}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-left font-display tracking-widest uppercase text-sm"
            >
              <div className="w-4 h-4" />
              <span className="mt-0.5">Remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}