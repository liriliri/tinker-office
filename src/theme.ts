export const tw = {
  background: {
    primary: 'bg-[#f5f5f5] dark:bg-[#1e1e1e]',
    surface: 'bg-white dark:bg-[#252526]',
    code: 'bg-[#f5f5f5] dark:bg-[#2d2d2d]',
  },

  text: {
    secondary: 'text-[#333] dark:text-[#ccc]',
    tertiary: 'text-[#666] dark:text-[#999]',
    quaternary: 'text-[#888] dark:text-[#777]',
    placeholder: 'placeholder:text-[#999] dark:placeholder:text-[#666]',
    white: 'text-white',
  },

  border: {
    secondary: 'border-[#ddd] dark:border-[#3c3c3c]',
    focus: 'border-[#888] dark:border-[#666]',
  },

  button: {
    primary: {
      base: 'bg-[#0066cc] dark:bg-[#0078d4]',
      hover: 'hover:bg-[#005aad] dark:hover:bg-[#1a86d9]',
      disabled: 'disabled:bg-[#ccc] dark:disabled:bg-[#444]',
    },
    secondary: {
      base: 'bg-white dark:bg-[#2d2d2d]',
      hover: 'hover:bg-[#f0f0f0] dark:hover:bg-[#383838]',
      border: 'border-[#ccc] dark:border-[#555]',
    },
    active: {
      base: 'bg-[#e8f0fe] dark:bg-[#333]',
      border: 'border-[#0066cc] dark:border-[#0078d4]',
      text: 'text-[#0066cc] dark:text-[#4da3ff]',
    },
  },

  input: {
    base: 'bg-white dark:bg-[#252526]',
    border: 'border-[#ccc] dark:border-[#555]',
    text: 'text-[#1a1a1a] dark:text-[#e8e8e8]',
    focusRing:
      'focus:ring-1 focus:ring-[#0066cc]/40 dark:focus:ring-[#0078d4]/40',
  },

  separator: 'bg-[#ddd] dark:bg-[#3c3c3c]',

  scrollbar: {
    thumb: 'bg-[#ccc] dark:bg-[#555]',
    thumbHover: 'hover:bg-[#aaa] dark:hover:bg-[#666]',
  },

  error: {
    background: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    icon: {
      text: 'text-red-600 dark:text-red-400',
    },
    text: {
      title: 'text-red-800 dark:text-red-300',
      content: 'text-red-700 dark:text-red-400',
    },
  },

  serverBadge: {
    background: 'bg-[#f0f0f0] dark:bg-[#2d2d2d]',
    border: 'border-[#ddd] dark:border-[#444]',
    text: 'text-[#666] dark:text-[#999]',
  },
}
