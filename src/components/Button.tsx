import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./ui.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  wide?: boolean;
}

export function Button({ children, className = "", variant = "primary", wide = false, ...props }: PropsWithChildren<ButtonProps>) {
  const variantClass = variant === "primary" ? "" : styles[variant];
  return (
    <button className={`${styles.button} ${variantClass} ${wide ? styles.wide : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}
