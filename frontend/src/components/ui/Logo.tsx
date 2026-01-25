import React from 'react';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon' | 'small';
  className?: string;
  alt?: string;
}

/**
 * オレンジゴーグルロゴコンポーネント
 * ブランド統一のため、Sidebar、ログイン画面などで使用
 */
export default function Logo({ variant = 'full', className = '', alt = 'Omamori' }: LogoProps) {
  const sizeClass =
    variant === 'icon' ? 'h-10 w-10' : variant === 'small' ? 'h-16 w-auto' : 'h-10 w-auto';

  const src = '/logo.png';

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image src={src} alt={alt} width={280} height={120} className={sizeClass} priority />
        <span className="text-xl font-bold tracking-wider text-warm-brown-800 dark:text-warm-brown-100">
          Omamori
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={280}
      height={120}
      className={`${sizeClass} ${className}`}
      priority={variant === 'small'}
    />
  );
}
