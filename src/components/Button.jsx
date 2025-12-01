import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',        
  icon: Icon,          
  isLoading = false, 
  disabled = false,
  className,
  type = 'button'
}) {
  
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] touch-manipulation select-none";
  
  const variants = {
    primary: "bg-things-blue text-white shadow-sm hover:bg-blue-600 hover:shadow-md border border-transparent active:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-200 shadow-sm hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100",
    danger: "bg-white text-red-600 border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 active:bg-red-50",
    ghost: "bg-transparent text-gray-500 hover:text-things-blue hover:bg-gray-100/50 active:bg-gray-100"
  };

  const sizes = {
    sm: "text-xs px-3 py-2 rounded-md gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-lg gap-2",
    lg: "text-base px-6 py-3 rounded-xl gap-2.5"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={twMerge(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin w-4 h-4 shrink-0" />
      ) : Icon ? (
        <Icon className={clsx("w-4 h-4 shrink-0", size === 'lg' && "w-5 h-5")} />
      ) : null}
      
      <span>{children}</span>
    </button>
  );
}