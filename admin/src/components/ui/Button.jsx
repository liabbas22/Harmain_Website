const styles = {
  primary:
    "border border-brand-600 bg-brand-600 text-white shadow-[0_5px_12px_rgba(120,24,28,0.16)] hover:bg-brand-700 disabled:opacity-60",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60",
  danger:
    "border border-red-700 bg-red-700 text-white hover:bg-red-800 disabled:opacity-60",
  text: "border-transparent bg-transparent text-brand-700 hover:text-brand-700 hover:underline",
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`min-h-6 rounded-md px-2 text-sm font-extrabold transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
