import type { Prisma } from "@/generated/prisma/client";

/** Ana sayfadaki "Öne Çıkan Ürünler" bölümünde gösterilen en fazla ürün sayısı. */
export const FEATURED_LIMIT = 3;

/**
 * Ürünlerin sitedeki ve paneldeki sırası. Ana sayfa öne çıkanların ilk
 * FEATURED_LIMIT tanesini bu sırayla gösterir; panel de hangilerinin sığmadığını
 * aynı sıraya bakarak söyler.
 */
export const PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { createdAt: "desc" },
];
