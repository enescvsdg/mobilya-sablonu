/** Kullanıcının yetkisi: Süper Yönetici ya da bir çalışan rolü. */
export function AccessSelect({
  id,
  roles,
  defaultValue,
  disabled,
}: {
  id: string;
  roles: { id: string; name: string }[];
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      name="access"
      defaultValue={defaultValue ?? ""}
      disabled={disabled}
      required
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
    >
      <option value="" disabled>
        Rol seçin
      </option>
      {roles.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
      <option value="super">Süper Yönetici (her şeye erişir)</option>
    </select>
  );
}
