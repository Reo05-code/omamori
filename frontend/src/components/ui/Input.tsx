'use client';

import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = '', id, ...rest }: Props) {
  return (
    <>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-warm-brown-700">
          {label}
        </label>
      ) : null}
      <div className="mt-1">
        <input
          id={id}
          className={`block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange sm:text-sm placeholder-warm-brown-400 ${className}`}
          {...rest}
        />
      </div>
    </>
  );
}
