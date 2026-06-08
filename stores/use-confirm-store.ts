import { create } from "zustand";

type ConfirmVariant = "default" | "danger" | "success";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
};

type ConfirmState = ConfirmOptions & {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
};

type ConfirmStore = ConfirmState & {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  close: (value: boolean) => void;
};

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  title: "",
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
  resolve: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmText: options.confirmText ?? "Confirm",
        cancelText: options.cancelText ?? "Cancel",
        variant: options.variant ?? "default",
        resolve,
      });
    });
  },

  close: (value) => {
    const currentResolve = get().resolve;

    if (currentResolve) {
      currentResolve(value);
    }

    set({
      isOpen: false,
      title: "",
      description: "",
      confirmText: "Confirm",
      cancelText: "Cancel",
      variant: "default",
      resolve: null,
    });
  },
}));