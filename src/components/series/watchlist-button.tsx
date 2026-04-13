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
    <div className="relative" ref={menuRef}>
      <Button 
        variant={status ? "default" : "outline"} 
        className="gap-2" 
        disabled={saving}
        onClick={() => !saving && setOpen(!open)}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {status ? currentLabel : "Add to List"}
        <ChevronDown className={cn(
          "w-3.5 h-3.5 ml-1 opacity-60 transition-transform",
          open && "rotate-180"
        )} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 
          bg-popover border border-border shadow-md z-50">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm",
                "text-left hover:bg-muted transition-colors",
                status === opt.value ? "text-primary font-medium" : "text-foreground"
              )}
            >
              {status === opt.value && <Check className="w-3.5 h-3.5" />}
              {opt.label}
            </button>
          ))}
          {status && (
            <button
              onClick={handleRemove}
              className="w-full flex items-center px-3 py-2 text-sm 
                text-destructive hover:bg-destructive/10 text-left border-t border-border"
            >
              Remove from List
            </button>
          )}
        </div>
      )}
    </div>
  );
}