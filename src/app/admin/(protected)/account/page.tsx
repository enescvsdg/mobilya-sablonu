import { getCurrentAdmin } from "@/lib/dal";
import { isEmailConfigured } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { PasswordForm } from "@/components/admin/password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAccountPage() {
  const current = await getCurrentAdmin();
  const { lastLoginAt } = await prisma.adminUser.findUniqueOrThrow({
    where: { id: current.id },
    select: { lastLoginAt: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Hesabım</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Ad</dt>
              <dd>{current.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">E-posta</dt>
              <dd>{current.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rol</dt>
              <dd>{current.roleName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Son giriş</dt>
              <dd>
                {lastLoginAt
                  ? new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Europe/Istanbul",
                    }).format(lastLoginAt)
                  : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm emailEnabled={isEmailConfigured()} />
        </CardContent>
      </Card>
    </div>
  );
}
