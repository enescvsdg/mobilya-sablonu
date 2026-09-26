import { prisma } from "@/lib/prisma";
import { deleteInquiryAction } from "@/app/admin/actions/inquiries";
import { DeleteButton } from "@/components/admin/delete-button";
import { InquiryStatusSelect } from "@/components/admin/inquiry-status-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireView } from "@/lib/dal";
import { allows } from "@/lib/permissions";
import { ReadOnlySection } from "@/components/admin/read-only-notice";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminInquiriesPage() {
  const admin = await requireView("inquiries");
  const canEdit = allows(admin.permissions, "inquiries", "edit");
  const inquiries = await prisma.inquiry.findMany({
    include: {
      product: { include: { translations: { where: { languageCode: "tr" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReadOnlySection readOnly={!canEdit}>
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Gelen Talepler</h1>
        {inquiries.some((inquiry) => inquiry.status === "NEW") && (
          <Badge>
            {inquiries.filter((inquiry) => inquiry.status === "NEW").length} yeni
          </Badge>
        )}
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Gönderen</TableHead>
                <TableHead>Mesaj</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Dil</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {dateFormatter.format(inquiry.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-48">
                    <div className="font-medium">{inquiry.name}</div>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="block truncate text-xs text-muted-foreground hover:underline"
                    >
                      {inquiry.email}
                    </a>
                    {inquiry.phone && (
                      <a
                        href={`tel:${inquiry.phone}`}
                        className="block text-xs text-muted-foreground hover:underline"
                      >
                        {inquiry.phone}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {inquiry.product?.translations[0]?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs uppercase">
                    {inquiry.languageCode}
                  </TableCell>
                  <TableCell>
                    <InquiryStatusSelect
                      id={inquiry.id}
                      status={inquiry.status}
                      requesterName={inquiry.name}
                    />
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      action={deleteInquiryAction.bind(null, inquiry.id)}
                      confirmMessage={`${inquiry.name} tarafından gönderilen talebi silmek istediğine emin misin?`}
                      label={`${inquiry.name} talebini sil`}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {inquiries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Henüz talep yok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ReadOnlySection>
  );
}
