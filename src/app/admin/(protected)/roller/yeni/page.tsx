import { RoleForm } from "@/components/admin/role-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/dal";

export default async function NewRolePage() {
  await requireSuperAdmin();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Yeni Rol</h1>
      <Card>
        <CardContent>
          <RoleForm />
        </CardContent>
      </Card>
    </div>
  );
}
