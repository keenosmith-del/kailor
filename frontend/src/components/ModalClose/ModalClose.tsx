import type { ButtonHTMLAttributes } from "react";
import { X } from "lucide-react";
import "./ModalClose.css";
export function ModalClose({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} type="button" className={`modal-close ${className}`}>
      <X size={14} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}
