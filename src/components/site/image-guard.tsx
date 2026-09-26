"use client";

import { useEffect } from "react";

/**
 * Sitedeki görsellerin kolayca kaydedilmesini engeller: görsel üzerinde sağ
 * tık menüsü ("Resmi farklı kaydet", "Yeni sekmede aç") ve sürükleme
 * kapalıdır. Telefonda uzun basma menüsü, seçme ve yazdırma globals.css'te
 * ([data-image-guard]) kapatılır. Sayfanın geri kalanında sağ tık çalışır.
 *
 * Ekran görüntüsünü ya da tarayıcının geliştirici araçlarını hiçbir site
 * engelleyemez; amaç sıradan kopyalamayı zorlaştırmaktır.
 */
export function ImageGuard() {
  useEffect(() => {
    const onImage = (event: Event) =>
      event.target instanceof Element && event.target.closest("img, picture") !== null;
    const block = (event: Event) => {
      if (onImage(event)) event.preventDefault();
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return null;
}
