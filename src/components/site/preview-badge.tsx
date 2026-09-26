"use client";

import { useSyncExternalStore } from "react";

import { PREVIEW_HINT_COOKIE } from "@/lib/preview-cookies";

function subscribe() {
  // Çerez sayfa açıkken değişmez; önizlemeden çıkış yeni sayfa yükler.
  return () => {};
}

function hasPreviewHint() {
  return document.cookie.split("; ").includes(`${PREVIEW_HINT_COOKIE}=1`);
}

/**
 * Panelden "Siteyi önizle" ile gelen kullanıcıya gerçek siteyi gördüğünü
 * hatırlatır. Sayfalar statik üretildiği için sunucuda değil tarayıcıda,
 * önizleme çerezinin eşine bakılarak gösterilir. Ziyaretçide bu çerez
 * yoktur; olsa bile yalnızca bu şerit görünür, site açılmaz.
 */
export function PreviewBadge() {
  const visible = useSyncExternalStore(subscribe, hasPreviewHint, () => false);
  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 start-4 z-40 flex items-center gap-3 rounded-full bg-ink/90 px-4 py-2 font-body text-xs text-surface-warm shadow-lg backdrop-blur"
    >
      <span className="size-2 rounded-full bg-highlight" aria-hidden="true" />
      Önizleme modu
      {/* Çerezleri silen bir route handler; sayfa baştan yüklenmeli, <Link> olmaz. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/onizleme/cikis" className="text-highlight underline-offset-2 hover:underline">
        Çık
      </a>
    </div>
  );
}
