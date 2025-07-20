import React from 'react';
import Link from 'next/link';
import { colors, transitions } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-all';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: `bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    secondary: `bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    outline: `border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    ghost: `text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    danger: `bg-error-600 text-white hover:bg-error-700 focus:ring-2 focus:ring-error-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Combined classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClasses} ${className}`;
  
  // Loading state
  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  // Render as link if href is provided
  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {isLoading && loadingSpinner}
        {children}
      </Link>
    );
  }
  
  // Otherwise render as button
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && loadingSpinner}
      {children}
    </button>
  );
};