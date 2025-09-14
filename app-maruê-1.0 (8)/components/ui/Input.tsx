
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-oliva mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full px-3 py-2 bg-crema border border-lino rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oliva focus:border-oliva text-espresso"
        {...props}
      />
    </div>
  );
};

export default Input;