import { DomainOnboardingMode, VerificationStatus } from '@org/prisma/client';
import {
  buildExactHostDnsInstructions,
  buildWildcardDnsInstructions,
  buildWildcardProbeHostname,
  canAutoActivateBinding,
  getOwnershipLookupHostname,
  getRecordName,
} from './domain-utils.js';

describe('domain-utils', () => {
  it('builds apex records from ingress IPs', () => {
    expect(
      buildExactHostDnsInstructions('helixstore.com', 'helixstore.com', {
        canonicalTargetHost: 'edge.example.net',
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: ['2001:db8::10'],
      })
    ).toEqual([
      { type: 'A', name: '@', value: '203.0.113.10' },
      { type: 'AAAA', name: '@', value: '2001:db8::10' },
    ]);
  });

  it('prefers cname for subdomains when canonical target host exists', () => {
    expect(
      buildExactHostDnsInstructions(
        'b2b.helixstore.com',
        'helixstore.com',
        {
          canonicalTargetHost: 'edge.example.net',
          ipv4Addresses: ['203.0.113.10'],
          ipv6Addresses: [],
        }
      )
    ).toEqual([{ type: 'CNAME', name: 'b2b', value: 'edge.example.net' }]);
  });

  it('builds wildcard dns records and probe host', () => {
    expect(
      buildWildcardDnsInstructions('helixstore.com', {
        canonicalTargetHost: 'edge.example.net',
        ipv4Addresses: ['203.0.113.10'],
        ipv6Addresses: [],
      })
    ).toEqual([{ type: 'CNAME', name: '*', value: 'edge.example.net' }]);

    expect(buildWildcardProbeHostname('helixstore.com')).toBe(
      '__helix-wildcard-check.helixstore.com'
    );
  });

  it('builds ownership lookup host and record name', () => {
    expect(getOwnershipLookupHostname('helixstore.com')).toBe(
      '_helix-verify.helixstore.com'
    );
    expect(getRecordName('b2b.helixstore.com', 'helixstore.com')).toBe('b2b');
  });

  it('auto activates only verified apex or wildcard bindings', () => {
    expect(
      canAutoActivateBinding({
        hostname: 'helixstore.com',
        baseDomain: 'helixstore.com',
        onboardingMode: DomainOnboardingMode.EXACT_HOSTS,
        apexRoutingStatus: VerificationStatus.VERIFIED,
        wildcardRoutingStatus: VerificationStatus.PENDING,
      })
    ).toBe(true);

    expect(
      canAutoActivateBinding({
        hostname: 'b2b.helixstore.com',
        baseDomain: 'helixstore.com',
        onboardingMode: DomainOnboardingMode.EXACT_HOSTS,
        apexRoutingStatus: VerificationStatus.VERIFIED,
        wildcardRoutingStatus: VerificationStatus.PENDING,
      })
    ).toBe(false);

    expect(
      canAutoActivateBinding({
        hostname: 'b2b.helixstore.com',
        baseDomain: 'helixstore.com',
        onboardingMode: DomainOnboardingMode.HYBRID,
        apexRoutingStatus: VerificationStatus.VERIFIED,
        wildcardRoutingStatus: VerificationStatus.VERIFIED,
      })
    ).toBe(true);
  });
});
