import type { ReactNode, ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

export type ButtonColor = "primary" | "secondary" | "success" | "danger" | "warning" | "info";
export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  color = "primary",
  variant = "solid",
  size = "md",
  disabled,
  className,
  startIcon,
  endIcon,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[`btn-${color}`],
    styles[`btn-${variant}`],
    styles[`btn-${size}`],
    disabled && styles["btn-disabled"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {startIcon && <span className={styles["btn-icon"]}>{startIcon}</span>}
      {children}
      {endIcon && <span className={styles["btn-icon"]}>{endIcon}</span>}
    </button>
  );
}

