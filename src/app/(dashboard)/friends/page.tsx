"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, UserPlus, Check, X,
         Users, Loader2 } from "lucide-react";

interface ClerkUser {
  id: string;
  name: string;
  username: string | null;
  imageUrl: string;
  email?: string;
}

interface FriendRow {
  requesterId: string;
  addresseeId: string;
  status: string;
  createdAt: string;
}

export default function FriendsPage() {
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] =
    useState<ClerkUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<FriendRow[]>([]);
  const [pending, setPending] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const loadFriendData = useCallback(async () => {
    setLoading(true);
    try {
      const [f, r, p] = await Promise.all([
        fetch("/api/friends?type=friends").then(r => r.json()),
        fetch("/api/friends?type=requests").then(r => r.json()),
        fetch("/api/friends?type=pending").then(r => r.json()),
      ]);
      setFriends(f.friends ?? []);
      setRequests(r.requests ?? []);
      setPending(p.pending ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFriendData(); }, [loadFriendData]);

  // Debounced user search
  useEffect(() => {
    if (searchQ.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQ)}`
        );
        const data = await res.json();
        setSearchResults(data.users ?? []);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQ]);

  const sendRequest = async (friendId: string) => {
    setActionLoading(friendId);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      await loadFriendData();
      setSearchQ("");
      setSearchResults([]);
    } finally {
      setActionLoading(null);
    }
  };

  const respond = async (
    requesterId: string,
    action: "accept" | "decline"
  ) => {
    setActionLoading(requesterId);
    try {
      await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, action }),
      });
      await loadFriendData();
    } finally {
      setActionLoading(null);
    }
  };

  const removeFriend = async (friendId: string) => {
    setActionLoading(friendId);
    try {
      await fetch(
        `/api/friends?friendId=${friendId}`,
        { method: "DELETE" }
      );
      await loadFriendData();
    } finally {
      setActionLoading(null);
    }
  };

  const SectionHeader = ({ children }: {
    children: React.ReactNode
  }) => (
    <h2 style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "18px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "hsl(var(--foreground))",
      borderLeft: "3px solid hsl(var(--primary))",
      paddingLeft: "10px",
      margin: 0,
    }}>
      {children}
    </h2>
  );

  const UserCard = ({
    userId, label, sublabel, imageUrl, actions,
  }: {
    userId: string;
    label: string;
    sublabel?: string;
    imageUrl?: string;
    actions: React.ReactNode;
  }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      padding: "12px 16px",
      background: "var(--glass-bg)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1.5px solid var(--glass-border)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px"
      }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={label}
            width={36}
            height={36}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <div style={{
            width: "36px", height: "36px",
            borderRadius: "50%",
            background: "hsl(var(--primary) / 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "14px",
            color: "hsl(var(--primary))",
          }}>
            {label[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p style={{
            margin: 0, fontSize: "13px", fontWeight: 600,
            color: "hsl(var(--foreground))",
          }}>
            {label}
          </p>
          {sublabel && (
            <p style={{
              margin: 0, fontSize: "11px",
              color: "hsl(var(--muted-foreground))",
            }}>
              {sublabel}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        {actions}
      </div>
    </div>
  );

  const ActionBtn = ({
    onClick, icon: Icon, variant = "default", disabled,
  }: {
    onClick: () => void;
    icon: any;
    variant?: "default" | "danger" | "success";
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "32px", height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1.5px solid",
        borderColor:
          variant === "danger"
            ? "hsl(var(--destructive) / 0.4)"
            : variant === "success"
            ? "hsl(var(--primary) / 0.4)"
            : "hsl(var(--border))",
        background: "transparent",
        color:
          variant === "danger"
            ? "hsl(var(--destructive))"
            : variant === "success"
            ? "hsl(var(--primary))"
            : "hsl(var(--muted-foreground))",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        borderRadius: 0,
      }}
    >
      {disabled
        ? <Loader2 style={{
            width: "14px", height: "14px",
            animation: "spin 1s linear infinite",
          }} />
        : <Icon style={{ width: "14px", height: "14px" }} />
      }
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "640px" }}>

      <div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(28px, 5vw, 42px)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "hsl(var(--foreground))",
          margin: 0, lineHeight: 1,
        }}>
          Friends
        </h1>
        <p style={{
          fontSize: "13px",
          color: "hsl(var(--muted-foreground))",
          marginTop: "6px",
        }}>
          Connect with other anime fans and see what they're watching
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SectionHeader>Add Friend</SectionHeader>
        <div style={{ position: "relative", marginTop: "8px" }}>
          <Search style={{
            position: "absolute", left: "12px",
            top: "50%", transform: "translateY(-50%)",
            width: "14px", height: "14px",
            color: "hsl(var(--muted-foreground))",
            pointerEvents: "none",
          }} />
          {searching && (
            <Loader2 style={{
              position: "absolute", right: "12px",
              top: "50%", transform: "translateY(-50%)",
              width: "14px", height: "14px",
              color: "hsl(var(--muted-foreground))",
              animation: "spin 1s linear infinite",
            }} />
          )}
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by name or username..."
            style={{
              width: "100%",
              padding: "10px 40px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid var(--glass-border)",
              borderRadius: 0,
              fontSize: "13px",
              color: "hsl(var(--foreground))",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {searchResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {searchResults.map(u => {
              const alreadyPending = pending.some(
                p => p.addresseeId === u.id
              );
              const alreadyFriend = friends.some(
                f => f.requesterId === u.id || f.addresseeId === u.id
              );
              return (
                <UserCard
                  key={u.id}
                  userId={u.id}
                  label={u.name}
                  sublabel={u.username
                    ? `@${u.username}` : u.email}
                  imageUrl={u.imageUrl}
                  actions={
                    alreadyFriend ? (
                      <span style={{
                        fontSize: "11px",
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: "0.1em",
                        color: "hsl(var(--primary))",
                      }}>
                        Friends
                      </span>
                    ) : alreadyPending ? (
                      <span style={{
                        fontSize: "11px",
                        fontFamily: "'Bebas Neue', sans-serif",
                        letterSpacing: "0.1em",
                        color: "hsl(var(--muted-foreground))",
                      }}>
                        Pending
                      </span>
                    ) : (
                      <ActionBtn
                        onClick={() => sendRequest(u.id)}
                        icon={UserPlus}
                        variant="success"
                        disabled={actionLoading === u.id}
                      />
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SectionHeader>
            Requests ({requests.length})
          </SectionHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {requests.map(r => (
              <UserCard
                key={r.requesterId}
                userId={r.requesterId}
                label={r.requesterId.slice(0, 8) + "..."}
                sublabel="Wants to be friends"
                actions={
                  <>
                    <ActionBtn
                      onClick={() =>
                        respond(r.requesterId, "accept")}
                      icon={Check}
                      variant="success"
                      disabled={actionLoading === r.requesterId}
                    />
                    <ActionBtn
                      onClick={() =>
                        respond(r.requesterId, "decline")}
                      icon={X}
                      variant="danger"
                      disabled={actionLoading === r.requesterId}
                    />
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SectionHeader>
          My Friends ({friends.length})
        </SectionHeader>
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}>
            <Loader2 style={{
              width: "20px", height: "20px",
              color: "hsl(var(--primary))",
              animation: "spin 1s linear infinite",
            }} />
          </div>
        ) : friends.length === 0 ? (
          <div style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "var(--glass-bg)",
            border: "1.5px solid var(--glass-border)",
            marginTop: "8px",
          }}>
            <Users style={{
              width: "28px", height: "28px",
              color: "hsl(var(--muted-foreground))",
              margin: "0 auto 10px",
              display: "block",
            }} />
            <p style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              margin: 0,
            }}>
              No friends yet — search above to connect
            </p>
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginTop: "8px",
          }}>
            {friends.map(f => (
              <UserCard
                key={f.requesterId + f.addresseeId}
                userId={f.requesterId}
                label={f.requesterId.slice(0, 8) + "..."}
                sublabel="Friend"
                actions={
                  <ActionBtn
                    onClick={() => removeFriend(
                      f.requesterId === pending[0]?.requesterId
                        ? f.requesterId
                        : f.addresseeId
                    )}
                    icon={X}
                    variant="danger"
                    disabled={actionLoading === f.requesterId}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <SectionHeader>
            Sent ({pending.length})
          </SectionHeader>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginTop: "8px",
          }}>
            {pending.map(p => (
              <UserCard
                key={p.addresseeId}
                userId={p.addresseeId}
                label={p.addresseeId.slice(0, 8) + "..."}
                sublabel="Request pending"
                actions={
                  <ActionBtn
                    onClick={() =>
                      removeFriend(p.addresseeId)}
                    icon={X}
                    variant="danger"
                    disabled={
                      actionLoading === p.addresseeId
                    }
                  />
                }
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}