import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transports = [
    { code: 'CAMINHAO', name: 'Caminhão' },
    { code: 'CARRETA', name: 'Carreta' },
    { code: 'BITRUCK', name: 'Bi-truck' },
    { code: 'VAN', name: 'Van' },
  ];

  for (const t of transports) {
    await prisma.transportType.upsert({
      where: { code: t.code },
      update: { name: t.name },
      create: t,
    });
  }

  const items = [
    { sku: 'SKU-001', name: 'Pallet de Água Mineral 500ml', unit: 'PLT' },
    { sku: 'SKU-002', name: 'Caixa de Refrigerante 350ml', unit: 'CX' },
    { sku: 'SKU-003', name: 'Saco de Cimento 50kg', unit: 'SC' },
    { sku: 'SKU-004', name: 'Bobina de Papel Kraft', unit: 'UN' },
  ];

  for (const i of items) {
    await prisma.item.upsert({
      where: { sku: i.sku },
      update: { name: i.name, unit: i.unit },
      create: i,
    });
  }

  const caminhao = await prisma.transportType.findUniqueOrThrow({
    where: { code: 'CAMINHAO' },
  });
  const carreta = await prisma.transportType.findUniqueOrThrow({
    where: { code: 'CARRETA' },
  });

  const client = await prisma.client.upsert({
    where: { document: '12345678000190' },
    update: {},
    create: {
      name: 'Distribuidora Exemplo LTDA',
      document: '12345678000190',
    },
  });

  for (const transportTypeId of [caminhao.id, carreta.id]) {
    await prisma.clientTransportType.upsert({
      where: {
        clientId_transportTypeId: { clientId: client.id, transportTypeId },
      },
      update: {},
      create: { clientId: client.id, transportTypeId },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
