import { rm } from "node:fs/promises";

import {
  cleanUpTestAccounts,
  closePackageLanguages,
  deleteTestProducts,
  setComingSoon,
  setWhatsappNumber,
  TEST_WHATSAPP,
} from "./db";

/**
 * Yeni bir veritabanında "Yakında" modu açık başlar (migration). Testlerin
 * çoğu sitenin kendisini gezdiği için mod kapatılır; açık hâli
 * coming-soon.spec.ts diğer testler bittikten sonra kendisi dener.
 * Önceki çalıştırmalardan kalan test hesapları, ürünleri ve e-posta kutusu
 * temizlenir; yarıda kalmış bir çalıştırmanın açtığı paket dilleri kapatılır.
 * WhatsApp numarası şablonda boş başlar; testler için örnek hat yazılır.
 */
export default async function globalSetup() {
  await setComingSoon(false);
  await setWhatsappNumber(TEST_WHATSAPP);
  await closePackageLanguages();
  await cleanUpTestAccounts();
  await deleteTestProducts();
  if (process.env.EMAIL_OUTBOX_FILE) await rm(process.env.EMAIL_OUTBOX_FILE, { force: true });
}
