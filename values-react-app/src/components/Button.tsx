import React from 'react';

// Define possible button variants for styling
type ButtonVariant = 'primary' | 'secondary' | 'danger';

// Inherit standard button props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  // Add other custom props if needed, e.g., isLoading, icon
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  // Base styles
  const baseStyles =
    'px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150';

  // Variant styles
  let variantStyles = '';
  switch (variant) {
    case 'secondary':
      variantStyles = 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500';
      break;
    case 'danger':
      variantStyles = 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500';
      break;
    case 'primary':
    default:
      variantStyles = 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500';
      break;
  }

  // Combine base, variant, and custom classNames
  const combinedClassName = `${baseStyles} ${variantStyles} ${className || ''}`.trim();

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
