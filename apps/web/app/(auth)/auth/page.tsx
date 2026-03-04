'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import AuthLeftPanel from './components/AuthLeftPanel';
import AuthRightPanel from './components/AuthRightPanel';

const AuthPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') ?? 'login';

  const handleSwitch = (value: 'login' | 'register') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/auth?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen">
      <AuthLeftPanel tab={tab} onSwitch={handleSwitch} />
      <AuthRightPanel />
    </div>
  );
};

export default AuthPage;
