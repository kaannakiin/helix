'use client';

import {
  useCreateDomainSpace,
  useCreateStoreHostBinding,
  useDomainSpaces,
  useVerifyDomainSpaceApexRouting,
  useVerifyDomainSpaceOwnership,
  useVerifyDomainSpaceWildcardRouting,
  useVerifyStoreHostBindingRouting,
} from '@/core/hooks/useAdminSettings';
import { useAdminStore } from '@/core/hooks/useAdminStores';
import {
  Alert,
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { DomainOnboardingMode } from '@org/prisma/browser';
import type {
  DomainSpaceView,
  StoreHostBindingView,
} from '@org/schemas/admin/settings';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  Shield,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DnsRecordCard } from './components/DnsRecordCard';
import {
  extractBaseDomain,
  isApexHostname,
  normalizeHostname,
} from './hostname-utils';
import { useWizardState } from './wizard-state';

export default function DomainConnectWizard() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const t = useTranslations('frontend.admin.stores.domains.wizard');

  const { data: store } = useAdminStore(storeId);
  const { data: domainSpaces } = useDomainSpaces();

  const wizard = useWizardState();
  const [activeStep, setActiveStep] = useState(0);
  const [hostnameInput, setHostnameInput] = useState('');
  const [multiStoreChoice, setMultiStoreChoice] = useState('single');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    return () => wizard.reset();
  }, []);

  const createDomainSpace = useCreateDomainSpace({
    onSuccess: (result: DomainSpaceView) => {
      wizard.setDomainSpace({
        id: result.id,
        baseDomain: result.baseDomain,
        status: result.status,
        ownership: { status: result.ownership.status },
        routing: {
          apex: { status: result.routing.apex.status },
          wildcard: { status: result.routing.wildcard.status },
        },
      });
    },
    onError: (err) => {
      notifications.show({ color: 'red', message: err.message });
    },
  });

  const verifyOwnership = useVerifyDomainSpaceOwnership({
    onSuccess: (result: DomainSpaceView) => {
      wizard.setDomainSpace({
        id: result.id,
        baseDomain: result.baseDomain,
        status: result.status,
        ownership: { status: result.ownership.status },
        routing: {
          apex: { status: result.routing.apex.status },
          wildcard: { status: result.routing.wildcard.status },
        },
      });
      if (result.ownership.status === 'VERIFIED') {
        setVerifyError(null);
        setActiveStep(2);
      } else {
        setVerifyError(
          result.ownership.lastError || t('step2.verifyFailed')
        );
      }
    },
    onError: (err) => setVerifyError(err.message),
  });

  const verifyApexRouting = useVerifyDomainSpaceApexRouting({
    onSuccess: (result: DomainSpaceView) => {
      wizard.setDomainSpace({
        id: result.id,
        baseDomain: result.baseDomain,
        status: result.status,
        ownership: { status: result.ownership.status },
        routing: {
          apex: { status: result.routing.apex.status },
          wildcard: { status: result.routing.wildcard.status },
        },
      });
      if (result.routing.apex.status === 'VERIFIED') {
        setVerifyError(null);
        handleRoutingVerified();
      } else {
        setVerifyError(
          result.routing.apex.lastError || t('step3.verifyFailed')
        );
      }
    },
    onError: (err) => setVerifyError(err.message),
  });

  const verifyWildcardRouting = useVerifyDomainSpaceWildcardRouting({
    onSuccess: (result: DomainSpaceView) => {
      wizard.setDomainSpace({
        id: result.id,
        baseDomain: result.baseDomain,
        status: result.status,
        ownership: { status: result.ownership.status },
        routing: {
          apex: { status: result.routing.apex.status },
          wildcard: { status: result.routing.wildcard.status },
        },
      });
      if (result.routing.wildcard.status === 'VERIFIED') {
        setVerifyError(null);
        handleRoutingVerified();
      } else {
        setVerifyError(
          result.routing.wildcard.lastError || t('step3.verifyFailed')
        );
      }
    },
    onError: (err) => setVerifyError(err.message),
  });

  const createBinding = useCreateStoreHostBinding({
    storeId,
    onSuccess: (result: StoreHostBindingView) => {
      wizard.setBinding({
        id: result.id,
        hostname: result.hostname,
        status: result.status,
      });
      if (result.status === 'ACTIVE') {
        setActiveStep(3);
      }
    },
    onError: (err) => {
      notifications.show({ color: 'red', message: err.message });
    },
  });

  const verifyBindingRouting = useVerifyStoreHostBindingRouting({
    storeId,
    onSuccess: (result: StoreHostBindingView) => {
      wizard.setBinding({
        id: result.id,
        hostname: result.hostname,
        status: result.status,
      });
      if (result.status === 'ACTIVE') {
        setVerifyError(null);
        setActiveStep(3);
      } else {
        setVerifyError(
          result.routing.lastError || t('step3.verifyFailed')
        );
      }
    },
    onError: (err) => setVerifyError(err.message),
  });

  const handleRoutingVerified = useCallback(() => {
    if (!wizard.binding) {
      createBinding.mutate({
        storeId,
        domainSpaceId: wizard.domainSpace!.id,
        hostname: wizard.hostname,
        type: wizard.bindingType,
        routingMethod: 'HTTP_WELL_KNOWN',
      });
    } else {
      setActiveStep(3);
    }
  }, [wizard.binding, wizard.domainSpace, wizard.hostname, wizard.bindingType, storeId, createBinding]);

  const existingDomainSpace = useMemo(() => {
    if (!wizard.baseDomain || !domainSpaces) return null;
    return domainSpaces.find(
      (ds) =>
        normalizeHostname(ds.baseDomain) ===
        normalizeHostname(wizard.baseDomain)
    ) ?? null;
  }, [wizard.baseDomain, domainSpaces]);

  const activeDomainSpace = wizard.domainSpace
    ? domainSpaces?.find((ds) => ds.id === wizard.domainSpace!.id) ?? null
    : existingDomainSpace;

  // --- Step 1: Enter Domain ---
  const handleStep1Next = () => {
    const hostname = normalizeHostname(hostnameInput);
    if (!hostname) return;

    const baseDomain = extractBaseDomain(hostname);
    const isApex = isApexHostname(hostname, baseDomain);
    wizard.setHostname(hostname, baseDomain, isApex);
    wizard.setMultiStore(multiStoreChoice === 'multi');

    const existing = domainSpaces?.find(
      (ds) => normalizeHostname(ds.baseDomain) === baseDomain
    );

    if (existing) {
      wizard.setDomainSpace({
        id: existing.id,
        baseDomain: existing.baseDomain,
        status: existing.status,
        ownership: { status: existing.ownership.status },
        routing: {
          apex: { status: existing.routing.apex.status },
          wildcard: { status: existing.routing.wildcard.status },
        },
      });

      if (existing.ownership.status === 'VERIFIED') {
        setActiveStep(2);
      } else {
        setActiveStep(1);
      }
    } else {
      const onboardingMode: DomainOnboardingMode =
        multiStoreChoice === 'multi' ? 'HYBRID' : 'EXACT_HOSTS';
      createDomainSpace.mutate({
        baseDomain,
        onboardingMode,
        ownershipMethod: 'TXT_TOKEN',
        apexRoutingMethod: 'HTTP_WELL_KNOWN',
        wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
      });
      setActiveStep(1);
    }
  };

  // --- Step 2: Verify Ownership ---
  const handleStep2Verify = () => {
    if (!activeDomainSpace) return;
    setVerifyError(null);
    verifyOwnership.mutate(activeDomainSpace.id);
  };

  // --- Step 3: Setup Routing ---
  const handleStep3Verify = () => {
    if (!activeDomainSpace) return;
    setVerifyError(null);

    if (wizard.isApex) {
      verifyApexRouting.mutate(activeDomainSpace.id);
    } else if (wizard.isMultiStore) {
      verifyWildcardRouting.mutate(activeDomainSpace.id);
    } else {
      // EXACT_HOSTS mode: create binding first, then verify it
      if (!wizard.binding) {
        createBinding.mutate({
          storeId,
          domainSpaceId: activeDomainSpace.id,
          hostname: wizard.hostname,
          type: wizard.bindingType,
          routingMethod: 'HTTP_WELL_KNOWN',
        });
      } else {
        verifyBindingRouting.mutate(wizard.binding.id);
      }
    }
  };

  const isVerifying =
    verifyOwnership.isPending ||
    verifyApexRouting.isPending ||
    verifyWildcardRouting.isPending ||
    verifyBindingRouting.isPending ||
    createBinding.isPending;

  return (
    <Stack gap="lg">
      <Group>
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push(`/admin/stores/${storeId}?tab=domains`)}
        >
          {store?.name ?? t('backToStore')}
        </Button>
      </Group>

      <div>
        <Title order={2}>{t('title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('subtitle')}
        </Text>
      </div>

      <Stepper active={activeStep} size="sm">
        {/* Step 1: Enter Domain */}
        <Stepper.Step
          label={t('steps.enterDomain')}
          icon={<Search size={16} />}
        >
          <Paper withBorder radius="md" p="xl" mt="md">
            <Stack gap="lg">
              <div>
                <Text size="lg" fw={600}>
                  {t('step1.title')}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('step1.description')}
                </Text>
              </div>

              <TextInput
                label={t('step1.hostnameLabel')}
                placeholder={t('step1.hostnamePlaceholder')}
                value={hostnameInput}
                onChange={(e) => setHostnameInput(e.currentTarget.value)}
                size="md"
              />

              <Radio.Group
                value={multiStoreChoice}
                onChange={setMultiStoreChoice}
              >
                <Stack gap="xs">
                  <Radio
                    value="single"
                    label={t('step1.singleStore')}
                    description={t('step1.singleStoreDescription')}
                  />
                  <Radio
                    value="multi"
                    label={t('step1.multiStore')}
                    description={t('step1.multiStoreDescription')}
                  />
                </Stack>
              </Radio.Group>

              <Group justify="flex-end">
                <Button
                  onClick={handleStep1Next}
                  loading={createDomainSpace.isPending}
                  disabled={!hostnameInput.trim()}
                >
                  {t('next')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stepper.Step>

        {/* Step 2: Verify Ownership */}
        <Stepper.Step
          label={t('steps.verifyOwnership')}
          icon={<Shield size={16} />}
        >
          <Paper withBorder radius="md" p="xl" mt="md">
            <Stack gap="lg">
              <div>
                <Text size="lg" fw={600}>
                  {t('step2.title', { domain: wizard.baseDomain })}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('step2.description')}
                </Text>
              </div>

              {activeDomainSpace?.ownership.record && (
                <DnsRecordCard
                  title={t('step2.addRecord')}
                  records={[
                    {
                      type: activeDomainSpace.ownership.record.type,
                      name: activeDomainSpace.ownership.record.name,
                      value: activeDomainSpace.ownership.record.value,
                    },
                  ]}
                />
              )}

              {verifyError && (
                <Alert
                  icon={<AlertTriangle size={16} />}
                  color="yellow"
                  variant="light"
                >
                  <Text size="sm">{verifyError}</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {t('step2.retryHint')}
                  </Text>
                </Alert>
              )}

              <Group justify="space-between">
                <Button
                  variant="default"
                  onClick={() => setActiveStep(0)}
                >
                  {t('back')}
                </Button>
                <Button
                  onClick={handleStep2Verify}
                  loading={verifyOwnership.isPending}
                >
                  {t('step2.verify')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stepper.Step>

        {/* Step 3: Setup Routing */}
        <Stepper.Step
          label={t('steps.setupRouting')}
          icon={<Globe size={16} />}
        >
          <Paper withBorder radius="md" p="xl" mt="md">
            <Stack gap="lg">
              <div>
                <Text size="lg" fw={600}>
                  {t('step3.title', { hostname: wizard.hostname })}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('step3.description')}
                </Text>
              </div>

              {activeDomainSpace && (
                <RoutingDnsInstructions
                  domainSpace={activeDomainSpace}
                  isApex={wizard.isApex}
                  isMultiStore={wizard.isMultiStore}
                  hostname={wizard.hostname}
                  binding={wizard.binding}
                />
              )}

              {verifyError && (
                <Alert
                  icon={<AlertTriangle size={16} />}
                  color="yellow"
                  variant="light"
                >
                  <Text size="sm">{verifyError}</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {t('step3.retryHint')}
                  </Text>
                </Alert>
              )}

              <Group justify="space-between">
                <Button
                  variant="default"
                  onClick={() => setActiveStep(1)}
                >
                  {t('back')}
                </Button>
                <Button
                  onClick={handleStep3Verify}
                  loading={isVerifying}
                >
                  {t('step3.verify')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stepper.Step>

        {/* Step 4: Complete */}
        <Stepper.Completed>
          <Paper withBorder radius="md" p="xl" mt="md">
            <Stack gap="lg" align="center">
              <ThemeIcon size={64} radius="xl" color="green" variant="light">
                <Check size={32} />
              </ThemeIcon>

              <div style={{ textAlign: 'center' }}>
                <Text size="lg" fw={600}>
                  {t('step4.title')}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('step4.description', {
                    hostname: wizard.hostname,
                    storeName: store?.name ?? '',
                  })}
                </Text>
              </div>

              <Group>
                <Button
                  variant="default"
                  leftSection={<ExternalLink size={16} />}
                  onClick={() =>
                    window.open(`https://${wizard.hostname}`, '_blank')
                  }
                >
                  {t('step4.visitStore')}
                </Button>
                <Button
                  onClick={() => {
                    wizard.reset();
                    router.push(`/admin/stores/${storeId}?tab=domains`);
                  }}
                >
                  {t('step4.backToStore')}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stepper.Completed>
      </Stepper>
    </Stack>
  );
}

function RoutingDnsInstructions({
  domainSpace,
  isApex,
  isMultiStore,
  hostname,
  binding,
}: {
  domainSpace: DomainSpaceView;
  isApex: boolean;
  isMultiStore: boolean;
  hostname: string;
  binding: { id: string; hostname: string; status: string } | null;
}) {
  const t = useTranslations('frontend.admin.stores.domains.wizard');

  if (isApex) {
    const apexDns = domainSpace.routing.apex.dns ?? [];
    if (apexDns.length === 0) return null;
    return (
      <DnsRecordCard
        title={t('step3.apexInstructions')}
        records={apexDns.map((d) => ({
          type: d.type,
          name: d.name,
          value: d.value,
        }))}
      />
    );
  }

  if (isMultiStore) {
    const wildcardDns = domainSpace.routing.wildcard.dns ?? [];
    if (wildcardDns.length === 0) return null;
    return (
      <DnsRecordCard
        title={t('step3.wildcardInstructions')}
        records={wildcardDns.map((d) => ({
          type: d.type,
          name: d.name,
          value: d.value,
        }))}
      />
    );
  }

  // For exact host, show binding-level DNS if available
  if (binding) {
    // We'd need the full StoreHostBindingView here to get routing.dns
    // For now show a generic CNAME instruction
    return (
      <DnsRecordCard
        title={t('step3.exactHostInstructions')}
        records={[
          {
            type: 'CNAME',
            name: hostname.split('.')[0],
            value: domainSpace.routing.apex.dns?.[0]?.value ?? hostname,
          },
        ]}
      />
    );
  }

  // Before binding is created, show expected DNS
  const apexDns = domainSpace.routing.apex.dns ?? [];
  if (apexDns.length > 0) {
    return (
      <DnsRecordCard
        title={t('step3.exactHostInstructions')}
        records={[
          {
            type: 'CNAME',
            name: hostname.split('.')[0],
            value: apexDns[0]?.value ?? hostname,
          },
        ]}
      />
    );
  }

  return null;
}
