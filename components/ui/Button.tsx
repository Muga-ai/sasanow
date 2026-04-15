import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "#E8A020",
    color: "#111210",
    border: "none",
  },
  secondary: {
    background: "#fff",
    color: "#111210",
    border: "1.5px solid rgba(0,0,0,0.12)",
  },
  ghost: {
    background: "transparent",
    color: "#6B6A65",
    border: "none",
  },
  danger: {
    background: "#FCEBEB",
    color: "#A32D2D",
    border: "1px solid rgba(162,45,45,0.2)",
  },
};

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: "7px 14px", fontSize: 12, borderRadius: 8 },
  md: { padding: "11px 20px", fontSize: 14, borderRadius: 10 },
  lg: { padding: "15px 28px", fontSize: 15, borderRadius: 10 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        ...sizes[size],
        fontFamily: "var(--font-dm)",
        fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.65 : 1,
        transition: "background 0.2s, opacity 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
