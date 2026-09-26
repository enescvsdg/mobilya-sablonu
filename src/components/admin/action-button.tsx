"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { UNEXPECTED_ERROR_MESSAGE, type ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

/**
 * Argümanı önceden bağlanmış bir sunucu action'ını çalıştıran genel buton.
 * Hata mesajını action'dan olduğu gibi gösterir (ör. "Varsayılan dil
 * yayından kaldırılamaz").
 */
export function ActionButton({
  action,
  children,
  successMessage,
  confirmMessage,
  variant = "outline",
  size = "sm",
  className,
  disabled,
  title,
}: {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  successMessage: string;
  confirmMessage?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      title={title}
      disabled={disabled || isPending}
      className={cn(className)}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          try {
            const result = await action();
            if (result?.error) {
              toast.error(result.error);
              return;
            }
            toast.success(successMessage);
          } catch (error) {
            console.error(error);
            toast.error(UNEXPECTED_ERROR_MESSAGE);
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
