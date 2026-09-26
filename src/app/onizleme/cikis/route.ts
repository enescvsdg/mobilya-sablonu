import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { PREVIEW_COOKIE, PREVIEW_HINT_COOKIE } from "@/lib/preview";

/** Önizlemeyi kapatır: tarayıcı yeniden ziyaretçinin gördüğünü görür. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(PREVIEW_COOKIE);
  response.cookies.delete(PREVIEW_HINT_COOKIE);
  return response;
}
