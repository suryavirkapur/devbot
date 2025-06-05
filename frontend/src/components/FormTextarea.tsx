import React from "react";

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  id,
  error,
  ...props
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 mb-1"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        {...props}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-slate-300 focus:ring-sky-500 focus:border-sky-500"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};
