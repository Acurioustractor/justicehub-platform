import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  rounded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  border = false,
  rounded = true,
}) => {
  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
  };
  
  // Border classes
  const borderClasses = border ? 'border border-gray-200' : '';
  
  // Rounded classes
  const roundedClasses = rounded ? 'rounded-lg' : '';
  
  // Combined classes
  const cardClasses = `bg-white ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClasses} ${roundedClasses} ${className}`;
  
  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};