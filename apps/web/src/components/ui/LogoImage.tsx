'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoImageProps {
  className?: string;
  width?: number;
  height?: number;
  /** Extra class applied to the fallback badge */
  fallbackClassName?: string;
}

export function LogoImage({ className = '', width = 120, height = 48, fallbackClassName = '' }: LogoImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className={`font-black tracking-tight ${fallbackClassName}`}>AP</span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="AP – Design. Print. Deliver."
      width={width}
      height={height}
      className={className}
      priority
      onError={() => setError(true)}
    />
  );
}
