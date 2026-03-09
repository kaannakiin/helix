'use client';

import AuthLeftPanel from './components/AuthLeftPanel';
import AuthRightPanel from './components/AuthRightPanel';

const AuthPage = () => {
  return (
    <div className="flex min-h-screen">
      <AuthLeftPanel />
      <AuthRightPanel />
    </div>
  );
};

export default AuthPage;
