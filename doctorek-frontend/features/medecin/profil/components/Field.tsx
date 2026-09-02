interface FieldProps {
  label: string
  required?: boolean
  htmlFor?: string
  children: React.ReactNode
}

export function Field({ label, required, htmlFor, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-[14px] font-medium text-[#35415D]">
        {label}
        {required && <span className="ml-1 text-[#E01E5A]">*</span>}
      </label>
      {children}
    </div>
  )
}
