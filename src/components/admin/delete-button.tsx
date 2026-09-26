"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { UNEXPECTED_ERROR_MESSAGE, type ActionResult } from "@/lib/action-result";

export function DeleteButton({
  action,
  confirmMessage,
  label,
}: {
  action: () => Promise<ActionResult>;
  confirmMessage: string;
  /** İkon-only butonun erişilebilir adı, ör. "Lacivert Kadife varyantını sil". */
  label: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isPending}
      aria-label={label}
      title={label}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          try {
            const result = await action();
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Silindi.");
          } catch (error) {
            console.error(error);
            toast.error(UNEXPECTED_ERROR_MESSAGE);
          }
        });
      }}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
