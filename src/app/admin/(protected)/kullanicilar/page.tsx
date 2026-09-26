import Link from "next/link";
import { Pencil, Send, UserCheck, UserX } from "lucide-react";

import {
  deleteUserAction,
  resendInviteAction,
  setUserActiveAction,
} from "@/app/admin/actions/users";
import { ActionButton } from "@/components/admin/action-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/dal";
import { isEmailConfigured } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kullanıcılar" };

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

/** Davet bağlantısının süresi geçti mi (istek anına göre). */
function hasExpired(date: Date) {
  return date.getTime() < Date.now();
}

export default async function UsersPage() {
  const me = await requireSuperAdmin();
  const [users, roles] = await Promise.all([
    prisma.adminUser.findMany({
      include: {
        staffRole: true,
        authTokens: {
          where: { type: "INVITE", usedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.staffRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Panele girebilen kişiler. Ne görebileceklerini{" "}
          <Link href="/admin/roller" className="underline underline-offset-2">
            Roller
          </Link>{" "}
          belirler; Süper Yönetici her şeye erişir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni kullanıcı davet et</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteUserForm roles={roles} emailEnabled={isEmailConfigured()} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Son giriş</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === me.id;
                const invite = user.authTokens[0];
                const pending = !user.activatedAt;
                const inviteExpired = pending && (!invite || hasExpired(invite.expiresAt));

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf && (
                        <Badge variant="outline" className="ml-2">
                          Siz
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.role === "SUPER_ADMIN"
                        ? "Süper Yönetici"
                        : (user.staffRole?.name ?? "Rol atanmamış")}
                    </TableCell>
                    <TableCell>
                      {!user.isActive ? (
                        <Badge variant="secondary">Pasif</Badge>
                      ) : pending ? (
                        <Badge variant="outline" className="border-amber-400 text-amber-800">
                          {inviteExpired
                            ? "Davetin süresi doldu"
                            : `Davet bekliyor · ${dateTime.format(invite!.expiresAt)}'e kadar`}
                        </Badge>
                      ) : (
                        <Badge>Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt ? dateTime.format(user.lastLoginAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {pending && user.isActive && (
                          <ActionButton
                            action={resendInviteAction.bind(null, user.id)}
                            successMessage="Davet yeniden gönderildi."
                            variant="ghost"
                            size="icon"
                            title="Daveti yeniden gönder"
                          >
                            <Send className="size-4" />
                          </ActionButton>
                        )}
                        {!isSelf && (
                          <ActionButton
                            action={setUserActiveAction.bind(null, user.id, !user.isActive)}
                            successMessage={
                              user.isActive ? "Kullanıcı pasif yapıldı." : "Kullanıcı yeniden aktif."
                            }
                            confirmMessage={
                              user.isActive
                                ? `${user.name} pasif yapılsın mı? Açık oturumu hemen kapanır ve giriş yapamaz.`
                                : undefined
                            }
                            variant="ghost"
                            size="icon"
                            title={user.isActive ? "Pasif yap" : "Aktif yap"}
                          >
                            {user.isActive ? (
                              <UserX className="size-4" />
                            ) : (
                              <UserCheck className="size-4" />
                            )}
                          </ActionButton>
                        )}
                        <Button asChild variant="ghost" size="icon" title="Düzenle">
                          <Link href={`/admin/kullanicilar/${user.id}`} aria-label={`${user.name} kullanıcısını düzenle`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        {!isSelf && (
                          <DeleteButton
                            action={deleteUserAction.bind(null, user.id)}
                            confirmMessage={`${user.name} silinsin mi? Bu işlem geri alınamaz; işlem kayıtlarındaki adı korunur.`}
                            label={`${user.name} kullanıcısını sil`}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
