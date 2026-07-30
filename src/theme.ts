export const tw = {
  background: {
    primary: 'bg-[#f5f5f5] dark:bg-[#1e1e1e]',
    surface: 'bg-white dark:bg-[#252526]',
  },

  text: {
    secondary: 'text-[#333] dark:text-[#ccc]',
    quaternary: 'text-[#888] dark:text-[#777]',
  },

  border: {
    secondary: 'border-[#ddd] dark:border-[#3c3c3c]',
  },

  button: {
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
}
