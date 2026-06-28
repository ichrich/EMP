import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import "./modal.css";

type ModalProps = {
  children: ReactNode;
  description?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Modal({ children, description, onOpenChange, open, title }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal__overlay" />
        <Dialog.Content className="modal__content">
          <div className="modal__header">
            <Dialog.Title className="modal__title">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="modal__description">{description}</Dialog.Description>
            ) : null}
          </div>
          <Dialog.Close asChild>
            <Button className="modal__close" size="icon" variant="ghost" aria-label="Закрыть окно">
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
