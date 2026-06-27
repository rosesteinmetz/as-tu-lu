'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    const params = new URLSearchParams(hash.replace('#', '?'));
    const type = params.get('type');

    const supabase = createClient();
    supabase.auth.getSession().then(({ data, error }) => {
      if (data.session) {
        window.history.replaceState(null, '', window.location.pathname);
        if (type === 'recovery') {
          router.push('/auth/update-password');
        } else if (type === 'signup') {
          router.push('/auth/confirm');
        } else {
          router.push('/dashboard');
        }
      }
    });
  }, [router]);

  return null;
}
