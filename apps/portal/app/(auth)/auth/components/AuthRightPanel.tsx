import { Stack, Text } from '@mantine/core';
import { ShieldCheck } from 'lucide-react';

const AuthRightPanel = () => {
  return (
    <div className="flex w-1/2 shrink-0 min-h-screen items-center justify-center relative overflow-hidden bg-[linear-gradient(135deg,#064e3b_0%,#065f46_50%,#047857_100%)]">
      <div className="absolute size-[400px] rounded-full border border-white/[0.06] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute size-[600px] rounded-full border border-white/[0.04] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <Stack align="center" gap="lg" className="relative z-[1]">
        <ShieldCheck size={72} color="rgba(255,255,255,0.12)" strokeWidth={1} />
        <Stack align="center" gap="xs">
          <Text size="xl" fw={700} c="white" ta="center">
            Secure by design
          </Text>
          <Text
            size="sm"
            ta="center"
            maw={280}
            className="text-white/50 leading-relaxed"
          >
            JWT auth with refresh token rotation, multi-device session
            management and 2FA support.
          </Text>
        </Stack>
      </Stack>
    </div>
  );
};

export default AuthRightPanel;
