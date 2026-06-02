interface ResizableDividerProps {
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
}

export function ResizableDivider({ isDragging, onMouseDown }: ResizableDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`group relative flex w-1 shrink-0 cursor-col-resize select-none items-center justify-center transition-colors ${
        isDragging ? 'bg-[#1863A9]' : 'bg-gray-200 hover:bg-[#1863A9]/40'
      }`}
    >
      <div className={`absolute z-10 flex flex-col items-center gap-0.5 rounded-full px-0.5 py-2 transition-opacity ${
        isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <svg className="h-3 w-3 text-[#1863A9]" fill="currentColor" viewBox="0 0 16 16">
          <path
            d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
            transform="rotate(90 8 8)"
          />
        </svg>
      </div>
    </div>
  )
}
