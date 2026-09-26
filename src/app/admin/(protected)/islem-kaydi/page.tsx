import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVITY_RETENTION_DAYS, pruneActivity } from "@/lib/activity";
import { requireSuperAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "İşlem Kaydı" };

const PAGE_SIZE = 50;

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string; kisi?: string }>;
}) {
  await requireSuperAdmin();
  await pruneActivity();

  const { sayfa, kisi } = await searchParams;
  const page = Math.max(1, Number.parseInt(sayfa ?? "1", 10) || 1);
  const where = kisi ? { userName: kisi } : {};

  const [entries, total, people] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      distinct: ["userName"],
      select: { userName: true },
      orderBy: { userName: "asc" },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (params: { sayfa?: number; kisi?: string }) => {
    const search = new URLSearchParams();
    if (params.kisi) search.set("kisi", params.kisi);
    if (params.sayfa && params.sayfa > 1) search.set("sayfa", String(params.sayfa));
    const query = search.toString();
    return `/admin/islem-kaydi${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">İşlem Kaydı</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Panelde kim, ne zaman, ne yaptı. Kayıtlar {ACTIVITY_RETENTION_DAYS} gün saklanır.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={link({})}
          className={`rounded-full border px-3 py-1 ${!kisi ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          Herkes
        </Link>
        {people.map(({ userName }) => (
          <Link
            key={userName}
            href={link({ kisi: userName })}
            className={`rounded-full border px-3 py-1 ${kisi === userName ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {userName}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kayıt yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Tarih</TableHead>
                  <TableHead className="w-44">Kişi</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {dateTime.format(entry.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{entry.userName}</TableCell>
                    <TableCell className="whitespace-normal">{entry.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <nav aria-label="Sayfalar" className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link href={link({ kisi, sayfa: page - 1 })} className="underline underline-offset-2">
              ← Daha yeni
            </Link>
          )}
          <span className="text-muted-foreground">
            Sayfa {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link href={link({ kisi, sayfa: page + 1 })} className="underline underline-offset-2">
              Daha eski →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
