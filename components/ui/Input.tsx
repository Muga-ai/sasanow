import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontFamily: "var(--font-dm)",
            fontSize: 13,
            fontWeight: 500,
            color: "#111210",
          }}
        >
          {label}
          {hint && (
            <span style={{ fontWeight: 400, color: "#9B9A95", marginLeft: 6 }}>
              — {hint}
            </span>
          )}
        </label>
      )}
      <input
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 10,
          border: error
            ? "1.5px solid #E24B4A"
            : focused
            ? "1.5px solid #E8A020"
            : "1.5px solid rgba(0,0,0,0.12)",
          fontSize: 15,
          fontFamily: "var(--font-dm)",
          color: "#111210",
          outline: "none",
          background: "#FAFAF8",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
          ...style,
        }}
        {...props}
      />
      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm)",
            fontSize: 12,
            color: "#E24B4A",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, style, ...props }: TextareaProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontFamily: "var(--font-dm)", fontSize: 13, fontWeight: 500, color: "#111210" }}>
          {label}
          {hint && <span style={{ fontWeight: 400, color: "#9B9A95", marginLeft: 6 }}>— {hint}</span>}
        </label>
      )}
      <textarea
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%", padding: "13px 16px", borderRadius: 10,
          border: error ? "1.5px solid #E24B4A" : focused ? "1.5px solid #E8A020" : "1.5px solid rgba(0,0,0,0.12)",
          fontSize: 15, fontFamily: "var(--font-dm)", color: "#111210",
          outline: "none", background: "#FAFAF8", transition: "border-color 0.2s",
          resize: "vertical", minHeight: 80, boxSizing: "border-box", ...style,
        }}
        {...props}
      />
      {error && <p style={{ fontFamily: "var(--font-dm)", fontSize: 12, color: "#E24B4A", margin: 0 }}>{error}</p>}
    </div>
  );
}
