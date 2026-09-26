import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { deleteRoleAction } from "@/app/admin/actions/roles";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/dal";
import { LEVEL_LABELS, SECTIONS, SECTION_LABELS, parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Roller" };

export default async function RolesPage() {
  await requireSuperAdmin();
  const roles = await prisma.staffRole.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Roller</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Çalışanların hangi bölümü görüp düzenleyebileceği. Süper Yönetici her şeye erişir.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/roller/yeni">
            <Plus className="size-4" />
            Yeni Rol
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz rol yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Yetkiler</TableHead>
                  <TableHead className="text-right">Kullanıcı</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => {
                  const permissions = parsePermissions(role.permissions);
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {SECTIONS.filter((section) => permissions[section] !== "none").map(
                            (section) => (
                              <Badge
                                key={section}
                                variant={permissions[section] === "edit" ? "default" : "outline"}
                              >
                                {SECTION_LABELS[section]}: {LEVEL_LABELS[permissions[section]]}
                              </Badge>
                            )
                          )}
                          {SECTIONS.every((section) => permissions[section] === "none") && (
                            <span className="text-xs text-muted-foreground">
                              Hiçbir bölüme erişemez
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{role._count.users}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Düzenle">
                            <Link href={`/admin/roller/${role.id}`} aria-label={`${role.name} rolünü düzenle`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <DeleteButton
                            action={deleteRoleAction.bind(null, role.id)}
                            confirmMessage={`"${role.name}" rolü silinsin mi?`}
                            label={`${role.name} rolünü sil`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
