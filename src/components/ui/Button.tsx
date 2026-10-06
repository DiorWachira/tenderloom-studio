import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', type = 'button', className, ...rest }: ButtonProps) {
  const classes = className ? `btn btn--${variant} ${className}` : `btn btn--${variant}`
  return <button type={type} className={classes} {...rest} />
}
