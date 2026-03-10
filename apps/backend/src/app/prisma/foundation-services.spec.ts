import {
  DocumentNumberType,
  ExternalEntityType,
  SourceSystem,
} from '@org/prisma/client';
import { DocumentNumberService } from './document-number.service';
import { ExternalReferenceService } from './external-reference.service';

describe('DocumentNumberService', () => {
  it('seeds from existing stock movement numbers and increments', async () => {
    const tx = {
      numberSeries: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue({ lastValue: 8 }),
      },
      stockMovementGroup: {
        findFirst: jest.fn().mockResolvedValue({
          documentNumber: 'SM-2026-000007',
        }),
      },
    };

    const service = new DocumentNumberService({} as never);

    const documentNumber = await service.nextStockMovementGroupNumber({
      storeId: 'store_1',
      date: new Date('2026-03-10T00:00:00.000Z'),
      tx: tx as never,
    });

    expect(documentNumber).toBe('SM-2026-000008');
    expect(tx.numberSeries.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          documentType_scopeKey_year: {
            documentType: DocumentNumberType.STOCK_MOVEMENT_GROUP,
            scopeKey: 'store:store_1',
            year: 2026,
          },
        },
        create: expect.objectContaining({
          lastValue: 7,
        }),
      })
    );
  });
});

describe('ExternalReferenceService', () => {
  it('upserts and resolves references with default externalSubRef', async () => {
    const prisma = {
      externalReference: {
        upsert: jest.fn().mockResolvedValue({ id: 'ext_1' }),
        findUnique: jest.fn().mockResolvedValue({ entityId: 'variant_1' }),
      },
    };

    const service = new ExternalReferenceService(prisma as never);

    await service.upsert({
      entityType: ExternalEntityType.PRODUCT_VARIANT,
      entityId: 'variant_1',
      sourceSystem: SourceSystem.SAP,
      externalRef: 'MAT-001',
    });

    await service.resolveByExternalRef({
      sourceSystem: SourceSystem.SAP,
      entityType: ExternalEntityType.PRODUCT_VARIANT,
      externalRef: 'MAT-001',
    });

    expect(prisma.externalReference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sourceSystem_entityType_entityId: {
            sourceSystem: SourceSystem.SAP,
            entityType: ExternalEntityType.PRODUCT_VARIANT,
            entityId: 'variant_1',
          },
        },
        create: expect.objectContaining({
          externalSubRef: '',
        }),
      })
    );

    expect(prisma.externalReference.findUnique).toHaveBeenCalledWith({
      where: {
        sourceSystem_entityType_externalRef_externalSubRef: {
          sourceSystem: SourceSystem.SAP,
          entityType: ExternalEntityType.PRODUCT_VARIANT,
          externalRef: 'MAT-001',
          externalSubRef: '',
        },
      },
    });
  });
});
