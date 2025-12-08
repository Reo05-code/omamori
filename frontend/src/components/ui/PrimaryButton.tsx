"use client"

import React from 'react'
import Spinner from './Spinner'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean
}

export default function PrimaryButton({ children, loading = false, className = '', disabled, ...rest }: Props) {
  const isDisabled = disabled || loading
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`flex w-full justify-center rounded-lg border border-transparent bg-warm-orange py-3 px-4 text-sm font-bold text-white shadow-md shadow-warm-orange/30 hover:bg-warm-orange-light focus:outline-none focus:ring-2 focus:ring-warm-orange focus:ring-offset-2 focus:ring-offset-warm-surface transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" className="text-white" />
          <span>処理中...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
