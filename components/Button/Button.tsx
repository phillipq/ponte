import { cva, type VariantProps } from "class-variance-authority"

import { twMerge } from "tailwind-merge"

const button = cva(
  [
    "justify-center",
    "inline-flex",
    "items-center",
    "rounded-xl",
    "text-center",
    "border",
    "transition-colors",
    "delay-50",
  ],
  {
    variants: {
      intent: {
        primary: ["bg-ponte-terracotta", "text-white", "hover:bg-accent-600"],
        secondary: ["bg-transparent", "text-ponte-terracotta", "border-ponte-terracotta", "btn-secondary"],
        accent: ["bg-ponte-olive", "text-white", "hover:bg-primary-600"],
        danger: ["bg-red-500", "text-white", "hover:bg-red-700", "border-red-500"],
      },
      size: {
        sm: ["min-w-20", "h-8", "text-sm", "py-1.5", "px-4"],
        lg: ["min-w-32", "h-10", "text-lg", "py-2.5", "px-6"],
      },
      underline: { true: ["underline"], false: [] },
    },
    defaultVariants: {
      intent: "primary",
      size: "lg",
    },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  underline?: boolean
  href?: string
  as?: "button" | "a"
}

export function Button({ className, intent, size, underline, as, href, ...props }: ButtonProps) {
  // If href is provided, automatically use as="a"
  const componentType = href ? "a" : (as || "button")
  
  if (componentType === "a" && href) {
    return (
      <a className={twMerge(button({ intent, size, className, underline }))} href={href} {...props}>
        {props.children}
      </a>
    )
  }
  
  return (
    <button className={twMerge(button({ intent, size, className, underline }))} {...props}>
      {props.children}
    </button>
  )
}
