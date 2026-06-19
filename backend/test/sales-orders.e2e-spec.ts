import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Sales Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = `e2e-${process.pid}`;
  let clientId: string;
  let authorizedTransportId: string;
  let unauthorizedTransportId: string;
  let itemId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);

    const authorized = await prisma.transportType.create({
      data: { code: `AUTH_${suffix}`.toUpperCase(), name: 'Authorized' },
    });
    const unauthorized = await prisma.transportType.create({
      data: { code: `NOAUTH_${suffix}`.toUpperCase(), name: 'Unauthorized' },
    });
    const item = await prisma.item.create({
      data: { sku: `SKU-${suffix}`, name: 'Test item' },
    });
    const client = await prisma.client.create({
      data: {
        name: 'Client E2E',
        document: `DOC-${suffix}`,
        authorizedTransports: { create: { transportTypeId: authorized.id } },
      },
    });

    authorizedTransportId = authorized.id;
    unauthorizedTransportId = unauthorized.id;
    itemId = item.id;
    clientId = client.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.salesOrder.deleteMany({ where: { id: orderId } });
    }
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.item.deleteMany({ where: { id: itemId } });
    await prisma.transportType.deleteMany({
      where: { id: { in: [authorizedTransportId, unauthorizedTransportId] } },
    });
    await app.close();
  });

  it('rejects creating an order with an unauthorized transport (400)', async () => {
    await request(app.getHttpServer())
      .post('/sales-orders')
      .send({
        clientId,
        transportTypeId: unauthorizedTransportId,
        items: [{ itemId, quantity: 1 }],
      })
      .expect(400);
  });

  it('creates a valid order with status CRIADA', async () => {
    const res = await request(app.getHttpServer())
      .post('/sales-orders')
      .send({
        clientId,
        transportTypeId: authorizedTransportId,
        items: [{ itemId, quantity: 3 }],
      })
      .expect(201);

    expect(res.body.status).toBe(OrderStatus.CRIADA);
    expect(res.body.items).toHaveLength(1);
    orderId = res.body.id;
  });

  it('rejects skipping flow steps (CRIADA → AGENDADA) with 409', async () => {
    await request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/status`)
      .send({ status: OrderStatus.AGENDADA })
      .expect(409);
  });

  it('advances to PLANEJADA', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/status`)
      .send({ status: OrderStatus.PLANEJADA })
      .expect(200);
    expect(res.body.status).toBe(OrderStatus.PLANEJADA);
  });

  it('blocks AGENDADA without a confirmed schedule (400)', async () => {
    await request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/status`)
      .send({ status: OrderStatus.AGENDADA })
      .expect(400);
  });

  it('confirming the schedule auto-advances the order to AGENDADA', async () => {
    await request(app.getHttpServer())
      .post(`/sales-orders/${orderId}/schedule`)
      .send({
        deliveryDate: '2026-12-01',
        windowStart: '08:00',
        windowEnd: '12:00',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/schedule/confirm`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/sales-orders/${orderId}`)
      .expect(200);
    expect(res.body.status).toBe(OrderStatus.AGENDADA);
  });

  it('records audit events for the order', async () => {
    const res = await request(app.getHttpServer())
      .get(`/audit-logs?entity=SalesOrder&entityId=${orderId}`)
      .expect(200);
    const actions = res.body.map((log: { action: string }) => log.action);
    expect(actions).toContain('ORDER_CREATED');
    expect(actions).toContain('STATUS_CHANGED');
  });
});
