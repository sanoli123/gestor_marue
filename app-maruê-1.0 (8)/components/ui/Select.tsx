
import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-oliva mb-1">
        {label}
      </label>
      <select
        id={id}
        className="w-full px-3 py-2 bg-crema border border-lino rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oliva focus:border-oliva text-espresso"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;