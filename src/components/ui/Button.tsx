// src/components/ui/Button.tsx - Updated with Fixed Text Colors
import React, { ButtonHTMLAttributes, forwardRef, memo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled, 
    className = '', 
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-brand-red hover:bg-brand-red-600 text-white shadow-lg hover:shadow-xl focus:ring-brand-red',
      secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-800 shadow-md hover:shadow-lg focus:ring-gray-500',
      outline: 'border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white bg-transparent focus:ring-brand-red',
      ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
      white: 'bg-white text-brand-red hover:bg-brand-red hover:text-white border-2 border-white hover:border-brand-red transition-all duration-200 focus:ring-brand-red'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };
    
    const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';