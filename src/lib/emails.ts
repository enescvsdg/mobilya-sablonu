import "server-only";

import { brand } from "@/config/brand";
import type { OutgoingEmail } from "@/lib/mailer";
import { withAlpha } from "@/lib/brand-theme";

const C = brand.colors;
/** İkincil yazılar (açıklama, alt bilgi): metin renginin soluğu. */
const MUTED = withAlpha(C.ink, 0.6);

/**
 * Panelin gönderdiği e-postalar. E-posta programları dış stil dosyası
 * okumadığı için biçim satır içi yazılır; her e-postanın düz metin hâli de
 * vardır.
 */

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, paragraphs: string[], action?: { label: string; url: string }) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${C.ink}">${p}</p>`)
    .join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:${C.brand};color:${C.surfaceWarm};text-decoration:none;padding:12px 22px;border-radius:6px;font-size:15px">${escapeHtml(action.label)}</a></p>
<p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:${MUTED}">Düğme çalışmazsa bu adresi tarayıcınıza yapıştırın:<br><span style="word-break:break-all">${escapeHtml(action.url)}</span></p>`
    : "";

  return `<!doctype html>
<html lang="tr"><body style="margin:0;background:${C.surfaceWarm};font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.surfaceWarm};padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="background:${C.brandDark};padding:22px 28px;text-align:center;font-family:Georgia,serif;letter-spacing:4px;color:${C.highlight};font-size:22px">${escapeHtml(brand.logo.primary)}${brand.logo.secondary ? ` <span style="font-size:13px;color:${C.highlightLight}">${escapeHtml(brand.logo.secondary)}</span>` : ""}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:21px;color:${C.brandDark}">${escapeHtml(title)}</h1>
${body}${button}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid ${C.hairline};font-size:12px;color:${MUTED}">Bu e-posta ${escapeHtml(brand.name)} yönetim panelinden otomatik gönderildi. Bu işlemi siz yapmadıysanız dikkate almayın; hesabınızda değişiklik olmaz.</td></tr>
</table></td></tr></table></body></html>`;
}

export function passwordResetEmail(to: string, name: string, url: string): OutgoingEmail {
  const title = "Şifrenizi sıfırlayın";
  return {
    to,
    subject: `${brand.name} panel şifrenizi sıfırlayın`,
    html: layout(
      title,
      [
        `Merhaba ${escapeHtml(name)},`,
        "Yönetim paneli için şifre sıfırlama istendi. Yeni şifrenizi belirlemek için aşağıdaki düğmeye tıklayın.",
        "<strong>Bağlantı 5 dakika geçerlidir ve yalnızca bir kez kullanılabilir.</strong>",
      ],
      { label: "Yeni şifre belirle", url }
    ),
    text: `Merhaba ${name},\n\nYönetim paneli için şifre sıfırlama istendi. Yeni şifrenizi belirlemek için bu bağlantıyı açın (5 dakika geçerli, tek kullanımlık):\n\n${url}\n\nBu işlemi siz yapmadıysanız bu e-postayı dikkate almayın.`,
  };
}

export function passwordChangeCodeEmail(to: string, name: string, code: string): OutgoingEmail {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  return {
    to,
    subject: `${brand.name} şifre değişikliği onay kodu`,
    html: layout("Şifre değişikliği onay kodu", [
      `Merhaba ${escapeHtml(name)},`,
      "Panelde şifrenizi değiştirmek için bu kodu girin:",
      `<span style="display:inline-block;font-family:Georgia,serif;font-size:32px;letter-spacing:8px;color:${C.brandDark}">${spaced}</span>`,
      "<strong>Kod 5 dakika geçerlidir.</strong> Kodu kimseyle paylaşmayın.",
    ]),
    text: `Merhaba ${name},\n\nPanelde şifrenizi değiştirmek için onay kodunuz: ${code}\n\nKod 5 dakika geçerlidir. Kodu kimseyle paylaşmayın. Bu işlemi siz yapmadıysanız şifreniz değişmez.`,
  };
}

export function inviteEmail(to: string, name: string, inviterName: string, url: string): OutgoingEmail {
  return {
    to,
    subject: `${brand.name} yönetim paneline davet edildiniz`,
    html: layout(
      "Panele davet edildiniz",
      [
        `Merhaba ${escapeHtml(name)},`,
        `${escapeHtml(inviterName)} sizi ${escapeHtml(brand.name)} yönetim paneline davet etti. Hesabınızı açmak için aşağıdaki düğmeye tıklayıp şifrenizi belirleyin.`,
        "<strong>Davet 24 saat geçerlidir.</strong> Süre dolarsa yöneticinizden daveti yeniden göndermesini isteyin.",
      ],
      { label: "Şifremi belirle", url }
    ),
    text: `Merhaba ${name},\n\n${inviterName} sizi ${brand.name} yönetim paneline davet etti. Şifrenizi belirlemek için bu bağlantıyı açın (24 saat geçerli):\n\n${url}`,
  };
}

export function passwordChangedEmail(to: string, name: string): OutgoingEmail {
  return {
    to,
    subject: `${brand.name} panel şifreniz değiştirildi`,
    html: layout("Şifreniz değiştirildi", [
      `Merhaba ${escapeHtml(name)},`,
      "Yönetim paneli şifreniz az önce değiştirildi ve diğer cihazlardaki oturumlarınız kapatıldı.",
      "Bu değişikliği siz yapmadıysanız hemen giriş ekranındaki <strong>Şifremi unuttum</strong> ile şifrenizi yenileyin ve yöneticinize haber verin.",
    ]),
    text: `Merhaba ${name},\n\nYönetim paneli şifreniz az önce değiştirildi ve diğer cihazlardaki oturumlarınız kapatıldı.\n\nBu değişikliği siz yapmadıysanız giriş ekranındaki "Şifremi unuttum" ile şifrenizi yenileyin ve yöneticinize haber verin.`,
  };
}
