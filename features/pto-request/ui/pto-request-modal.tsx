"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ptoRequestSchema, type PtoRequestValues } from "@/features/pto-request/model/schema";
import { Button } from "@/shared/ui/button";
import { Field, Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { Toast, ToastDescription, ToastTitle } from "@/shared/ui/toast";
import "./pto-request-modal.css";

type PtoRequestModalProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function PtoRequestModal({ onOpenChange, open }: PtoRequestModalProps) {
  const [toastOpen, setToastOpen] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset
  } = useForm<PtoRequestValues>({
    resolver: zodResolver(ptoRequestSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reason: ""
    }
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    reset();
    onOpenChange(false);
    setToastOpen(true);
  });

  return (
    <>
      <Modal
        description="Отправьте заявку на отпуск на согласование руководителю."
        onOpenChange={onOpenChange}
        open={open}
        title="Заявка на отпуск"
      >
        <form className="pto-form" onSubmit={onSubmit}>
          <div className="pto-form__grid">
            <Field label="Дата начала" error={errors.startDate?.message}>
              <Input type="date" {...register("startDate")} />
            </Field>
            <Field label="Дата окончания" error={errors.endDate?.message}>
              <Input type="date" {...register("endDate")} />
            </Field>
          </div>
          <Field label="Причина" error={errors.reason?.message}>
            <Input placeholder="Семейные дела, поездка, восстановление..." {...register("reason")} />
          </Field>
          <div className="pto-form__actions">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button disabled={isSubmitting} type="submit">
              Отправить заявку
            </Button>
          </div>
        </form>
      </Modal>
      <Toast open={toastOpen} onOpenChange={setToastOpen}>
        <ToastTitle>Заявка отправлена</ToastTitle>
        <ToastDescription>Заявка на отпуск отправлена вашему руководителю.</ToastDescription>
      </Toast>
    </>
  );
}
