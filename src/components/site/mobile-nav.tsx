"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/site/language-switcher";

type NavItem = { href: string; label: string };
type LanguageOption = { code: string; nativeName: string };

// Portal yalnızca istemcide açılabilir. useSyncExternalStore sunucu anlık
// görüntüsünde false, istemcide true döner — böylece hidrasyon uyuşmazlığı
// da, effect içinde setState çağırmanın yarattığı zincirleme render de olmaz.
const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const PANEL_ID = "mobile-nav-panel";

export function MobileNav({
  navItems,
  languages,
}: {
  navItems: NavItem[];
  languages: LanguageOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Panel açık ve tam ekranı opak kapladığı sürece: sayfa kaydırması
  // kilitlenir, ilk bağlantıya odaklanılır, Tab panel içinde döngüye
  // alınır ve Escape panelı kapatır. Bunlar olmadan Tab, görsel olarak
  // panelin altında gizlenmiş içeriğe geçerdi — klavye kullanıcısı
  // odağın nerede olduğunu göremez. Kapanınca odak tetikleyici düğmeye
  // döner.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      : [];
    focusables[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup zamanında ref.current değişmiş olabilir; odağı geri
    // vereceğimiz düğmeyi effect başında sabitliyoruz.
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={isOpen}
        aria-controls={PANEL_ID}
        onClick={() => setIsOpen((v) => !v)}
        className="flex size-9 items-center justify-center text-surface-warm"
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {isMounted
        ? createPortal(
            // Rendered via portal to document.body: the header uses
            // backdrop-blur, which creates a containing block for
            // position:fixed descendants — nesting this panel inside it
            // would anchor it to the 80px header instead of the viewport.
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  ref={panelRef}
                  id={PANEL_ID}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menü"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed inset-x-0 top-20 bottom-0 z-30 flex flex-col bg-brand-dark px-6 py-10"
                >
                  <nav className="flex flex-col gap-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="font-heading text-2xl text-surface-warm uppercase transition-colors hover:text-highlight"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-10">
                    <LanguageSwitcher languages={languages} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}
