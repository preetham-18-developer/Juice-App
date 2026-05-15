"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /admin to /admin/dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return null;
}
