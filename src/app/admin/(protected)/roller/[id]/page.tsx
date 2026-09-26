import { notFound } from "next/navigation";

import { RoleForm } from "@/components/admin/role-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/dal";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const role = await prisma.staffRole.findUnique({ where: { id } });
  if (!role) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Rolü Düzenle</h1>
      <Card>
        <CardContent>
          <RoleForm
            role={{ id: role.id, name: role.name, permissions: parsePermissions(role.permissions) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
