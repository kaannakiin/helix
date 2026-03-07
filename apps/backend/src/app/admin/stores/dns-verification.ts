import { resolve4, resolve6, resolveCname, resolveTxt } from 'node:dns/promises';
import type { DnsInstruction } from '@org/schemas/admin/settings';

function includesAll(actual: string[], expected: string[]): boolean {
  return expected.every((value) => actual.includes(value));
}

function normalizeRecordValue(value: string): string {
  return value.toLowerCase().replace(/\.+$/, '');
}

export async function verifyDnsInstructions(
  hostname: string,
  instructions: DnsInstruction[]
): Promise<boolean> {
  if (instructions.length === 0) return false;

  const expectedByType = instructions.reduce<Record<string, string[]>>(
    (acc, instruction) => {
      acc[instruction.type] ??= [];
      acc[instruction.type].push(normalizeRecordValue(instruction.value));
      return acc;
    },
    {}
  );

  if (expectedByType['CNAME']) {
    try {
      const answers = (await resolveCname(hostname)).map(normalizeRecordValue);
      if (!includesAll(answers, expectedByType['CNAME'])) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (expectedByType['A']) {
    try {
      const answers = await resolve4(hostname);
      if (!includesAll(answers, expectedByType['A'])) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (expectedByType['AAAA']) {
    try {
      const answers = await resolve6(hostname);
      if (!includesAll(answers, expectedByType['AAAA'])) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (expectedByType['TXT']) {
    try {
      const answers = (await resolveTxt(hostname))
        .flat()
        .map((value) => value.trim());
      if (!includesAll(answers, expectedByType['TXT'])) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export async function verifyTxtRecord(
  hostname: string,
  expected: string
): Promise<boolean> {
  try {
    const answers = (await resolveTxt(hostname)).flat().map((value) => value.trim());
    return answers.includes(expected);
  } catch {
    return false;
  }
}

export async function verifyHttpChallenge(
  url: string,
  expectedBody: string
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Accept: 'text/plain',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return false;
    }

    const body = (await response.text()).trim();
    return body === expectedBody;
  } catch {
    return false;
  }
}
