import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  const hoverStyles = hover ? 'hover:shadow-xl transition-shadow duration-300 cursor-pointer' : '';
  
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-md overflow-hidden
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

