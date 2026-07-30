export const tw = {
  background: {
    primary: 'bg-[#f5f5f5] dark:bg-[#1e1e1e]',
    surface: 'bg-white dark:bg-[#252526]',
  },

  text: {
    primary: 'text-[#1a1a1a] dark:text-[#e8e8e8]',
    secondary: 'text-[#333] dark:text-[#ccc]',
    tertiary: 'text-[#666] dark:text-[#999]',
    quaternary: 'text-[#888] dark:text-[#777]',
  },

  border: {
    secondary: 'border-[#ddd] dark:border-[#3c3c3c]',
  },

  scrollArea: {
    root: 'min-h-0 flex-1 overflow-hidden',
    viewport: 'h-full w-full [&>div]:!block',
    scrollbar:
      'flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:w-1.5 data-[state=visible]:opacity-100 data-[state=hidden]:opacity-0',
    thumb:
      'relative flex-1 rounded-full bg-[#ccc] hover:bg-[#aaa] dark:bg-[#555] dark:hover:bg-[#666]',
  },

  toast: {
    root: 'flex items-start gap-3 rounded-lg border border-[#ddd] bg-white px-4 py-3 shadow-lg dark:border-[#3c3c3c] dark:bg-[#2d2d2d]',
    title:
      'text-[12px] font-semibold tracking-wide text-red-600 dark:text-red-400',
    description:
      'mt-0.5 break-words text-[12px] leading-relaxed text-[#666] dark:text-[#999]',
    close:
      'shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#888] hover:text-[#333] dark:text-[#777] dark:hover:text-[#eee]',
    viewport:
      'fixed top-4 left-1/2 z-[100] flex w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 outline-none',
  },
}
