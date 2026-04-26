'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DesignUploadRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/design-studio');
  }, [router]);
  return null;
}
