/**
 * Service Worker pour les push notifications admin.
 *
 * Enregistré uniquement sur /admin/* via /components/admin/push-register.
 * Gère l'event `push` pour afficher la notification, et `notificationclick`
 * pour ouvrir l'URL associée.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Chauffage Artisanal", body: event.data.text() };
  }
  const title = payload.title ?? "Notification";
  const options = {
    body: payload.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/admin/leads";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      // Focus sur une fenêtre admin si elle existe
      for (const c of cs) {
        if (c.url.includes("/admin") && "focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
