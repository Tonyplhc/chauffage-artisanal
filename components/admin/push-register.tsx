"use client";

/**
 * UI pour s'abonner aux push notifications côté admin.
 *
 * Comportement :
 *   - Enregistre /admin-sw.js
 *   - Demande la permission notif au clic
 *   - Récupère la VAPID public key depuis /api/admin/push
 *   - Subscribe avec le SW et POST l'objet au serveur
 */

import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2, CheckCircle2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushRegister() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);
    fetch("/api/admin/push", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.vapidPublicKey) setVapidKey(data.vapidPublicKey);
        if (data?.subscriptions?.length > 0) setSubscribed(true);
      })
      .catch(() => {});
  }, []);

  const enable = async () => {
    if (!supported || !vapidKey) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/admin-sw.js", {
        scope: "/admin/",
      });
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      if (res.ok) setSubscribed(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Push subscribe failed", e);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin/");
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/admin/push?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <BellOff className="h-3.5 w-3.5" /> Push non supporté
      </span>
    );
  }

  if (!vapidKey) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <BellOff className="h-3.5 w-3.5" /> VAPID non configuré
      </span>
    );
  }

  return (
    <button
      onClick={subscribed ? disable : enable}
      disabled={busy || permission === "denied"}
      className={
        "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors " +
        (subscribed
          ? "border-[#22a06b]/40 bg-[#22a06b]/8 text-[#22a06b]"
          : permission === "denied"
          ? "border-ink/15 bg-cream text-muted cursor-not-allowed"
          : "border-ink/15 bg-white text-graphite hover:border-copper/40")
      }
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : subscribed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <BellRing className="h-4 w-4" />
      )}
      {subscribed
        ? "Push activé"
        : permission === "denied"
        ? "Push refusé navigateur"
        : "Activer push"}
    </button>
  );
}
