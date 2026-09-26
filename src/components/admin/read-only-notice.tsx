import { Eye } from "lucide-react";

/**
 * Bölümü yalnızca görüntüleme yetkisi olan kullanıcılar için: içindeki tüm
 * form alanları ve düğmeler kapanır. Asıl engel sunucudadır (requireEdit);
 * bu yalnızca kişinin boşuna denememesi içindir.
 */
export function ReadOnlySection({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: React.ReactNode;
}) {
  if (!readOnly) return <>{children}</>;
  return (
    <div className="flex flex-col gap-4">
      <p
        role="status"
        className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
      >
        <Eye className="size-4 shrink-0" />
        Bu bölümü yalnızca görüntüleyebilirsiniz; değişiklik yapma yetkiniz yok.
      </p>
      <fieldset disabled className="contents">
        {children}
      </fieldset>
    </div>
  );
}
