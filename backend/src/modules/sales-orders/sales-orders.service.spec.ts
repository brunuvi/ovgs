import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';
import { SalesOrdersService } from './sales-orders.service';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let prisma: {
    item: { findMany: jest.Mock };
    salesOrder: { count: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let clients: { findOne: jest.Mock; isTransportAuthorized: jest.Mock };
  let audit: { emit: jest.Mock };

  beforeEach(() => {
    prisma = {
      item: { findMany: jest.fn() },
      salesOrder: { count: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };
    clients = { findOne: jest.fn(), isTransportAuthorized: jest.fn() };
    audit = { emit: jest.fn() };

    service = new SalesOrdersService(
      prisma as unknown as PrismaService,
      clients as unknown as ClientsService,
      audit as unknown as AuditService,
    );
  });

  const baseDto = {
    clientId: 'client-1',
    transportTypeId: 'transport-1',
    items: [{ itemId: 'item-1', quantity: 2 }],
  };

  describe('create — authorized transport rule', () => {
    it('rejects creation when the transport is not authorized for the client', async () => {
      clients.findOne.mockResolvedValue({ id: 'client-1', active: true });
      clients.isTransportAuthorized.mockResolvedValue(false);

      await expect(service.create(baseDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(audit.emit).not.toHaveBeenCalled();
    });

    it('rejects creation when an item does not exist', async () => {
      clients.findOne.mockResolvedValue({ id: 'client-1', active: true });
      clients.isTransportAuthorized.mockResolvedValue(true);
      prisma.item.findMany.mockResolvedValue([]);

      await expect(service.create(baseDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates the order and emits audit when everything is valid', async () => {
      clients.findOne.mockResolvedValue({ id: 'client-1', active: true });
      clients.isTransportAuthorized.mockResolvedValue(true);
      prisma.item.findMany.mockResolvedValue([{ id: 'item-1' }]);

      const created = {
        id: 'order-1',
        code: 'OV-0001',
        status: OrderStatus.CRIADA,
        clientId: 'client-1',
        transportTypeId: 'transport-1',
      };
      prisma.$transaction.mockImplementation(async (cb) =>
        cb({
          salesOrder: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(created),
          },
        }),
      );

      const result = await service.create(baseDto);

      expect(result).toEqual(created);
      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_CREATED',
          entity: 'SalesOrder',
          entityId: 'order-1',
        }),
      );
    });
  });

  describe('updateStatus — state machine', () => {
    it('rejects an invalid transition with ConflictException', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CRIADA,
        schedule: null,
      } as never);

      await expect(
        service.updateStatus('order-1', OrderStatus.AGENDADA),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('requires a confirmed schedule for AGENDADA', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PLANEJADA,
        schedule: { confirmed: false },
      } as never);

      await expect(
        service.updateStatus('order-1', OrderStatus.AGENDADA),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
