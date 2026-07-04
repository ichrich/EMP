import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import "./modal.css";

type ModalProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  layer?: "base" | "stacked";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Modal({ children, className, description, layer = "base", onOpenChange, open, title }: ModalProps) {
  const overlayClassName = layer === "stacked" ? "modal__overlay modal__overlay--stacked" : "modal__overlay";
  const contentClassName = [
    "modal__content",
    layer === "stacked" ? "modal__content--stacked" : "",
    className ?? ""
  ].filter(Boolean).join(" ");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClassName} />
        <Dialog.Content className={contentClassName}>
          <div className="modal__header">
            <Dialog.Title className="modal__title">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="modal__description">{description}</Dialog.Description>
            ) : null}
          </div>
          <Dialog.Close asChild>
            <Button
              className="modal__close"
              size="icon"
              variant="ghost"
              aria-label="Закрыть окно"
              onClick={(event) => event.stopPropagation()}
            >
              <X size={16} />
            </Button>
          </Dialog.Close>
          <div className="modal__body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const ModalTrigger = Dialog.Trigger;
export type ModalTriggerProps = ComponentPropsWithoutRef<typeof Dialog.Trigger>;
