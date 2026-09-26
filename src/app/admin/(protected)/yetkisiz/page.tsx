import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <Card className="max-w-lg">
      <CardContent className="flex flex-col items-start gap-3">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Bu bölüm için yetkiniz yok</h1>
        <p className="text-sm text-muted-foreground">
          Bu sayfayı görmek ya da bu işlemi yapmak için rolünüzün yetkisi yetmiyor. Yetki
          gerekiyorsa Süper Yöneticiye başvurun.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin">Panele dön</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
