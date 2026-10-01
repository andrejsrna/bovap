"use client";

export default function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button
      onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}
      className="font-medium text-red-600 hover:text-red-700"
    >
      {children}
    </button>
  );
}
