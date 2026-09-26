import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EditUserForm } from "@/components/admin/edit-user-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuperAdmin();
  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.adminUser.findUnique({ where: { id } }),
    prisma.staffRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/kullanicilar" aria-label="Kullanıcılara dön" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Kullanıcıyı Düzenle</h1>
      </div>
      <Card>
        <CardContent>
          <EditUserForm
            roles={roles}
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              access: user.role === "SUPER_ADMIN" ? "super" : (user.staffRoleId ?? ""),
              pending: !user.activatedAt,
              isSelf: user.id === me.id,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
