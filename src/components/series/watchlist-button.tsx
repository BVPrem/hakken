"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Check, ChevronDown, Loader2 } from "lucide-react";

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

  useEffect(() => {
    fetch(`/api/user/series?seriesId=${seriesId}`)
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.entry?.status ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seriesId]);

  const handleSelect = async (newStatus: string) => {
    setSaving(true);
    try {
      await fetch("/api/user/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId, status: newStatus }),
      });
      setStatus(newStatus);
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
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant={status ? "default" : "outline"} className="gap-2" disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {status ? currentLabel : "Add to List"}
          <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={status === opt.value ? "text-primary font-medium" : ""}
          >
            {status === opt.value && <Check className="w-3.5 h-3.5 mr-2" />}
            {opt.label}
          </DropdownMenuItem>
        ))}
        {status && (
          <DropdownMenuItem
            onClick={handleRemove}
            className="text-destructive focus:text-destructive border-t border-border mt-1 pt-1"
          >
            Remove from List
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}