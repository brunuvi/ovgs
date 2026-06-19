import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useClients, useItems, useSalesOrders } from '../api/hooks';
import { ORDER_STATUS_FLOW, type OrderStatus } from '../api/types';
import { statusColor, StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const { data: orders, isLoading } = useSalesOrders();
  const { data: clients } = useClients();
  const { data: items } = useItems();

  if (isLoading || !orders) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }

  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).length;

  const pendingScheduling = orders.filter(
    (o) =>
      o.status === 'PLANEJADA' ||
      o.status === 'AGENDADA' ||
      (o.schedule && !o.schedule.confirmed),
  ).length;

  const recent = orders.slice(0, 5);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Dashboard</Title>
        <Group>
          <Button
            component={Link}
            to="/scheduling"
            variant="default"
            leftSection={<IconCalendarEvent size={16} />}
          >
            Agendamentos ({pendingScheduling})
          </Button>
          <Button component={Link} to="/orders/new" leftSection={<IconPlus size={16} />}>
            Nova Ordem
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard label="Total de Ordens" value={orders.length} />
        <StatCard label="Aguardando agendamento" value={pendingScheduling} />
        <StatCard label="Clientes" value={clients?.length ?? 0} />
        <StatCard label="Itens cadastrados" value={items?.length ?? 0} />
      </SimpleGrid>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Ordens por status
        </Title>
        <Group gap="xl">
          {ORDER_STATUS_FLOW.map((status) => (
            <Stack key={status} gap={4} align="center">
              <Text size="xl" fw={700}>
                {countByStatus(status)}
              </Text>
              <Badge color={statusColor(status)} variant="light">
                {status}
              </Badge>
            </Stack>
          ))}
        </Group>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Ordens recentes</Title>
          <Anchor component={Link} to="/orders" size="sm">
            ver todas
          </Anchor>
        </Group>
        {recent.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhuma ordem ainda. Crie a primeira.
          </Text>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Transporte</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recent.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td fw={600}>{o.code}</Table.Td>
                  <Table.Td>{o.client.name}</Table.Td>
                  <Table.Td>{o.transportType.name}</Table.Td>
                  <Table.Td>
                    <StatusBadge status={o.status} />
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/orders/${o.id}`} size="sm">
                      detalhes
                    </Anchor>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="2rem" fw={700} mt={4}>
        {value}
      </Text>
    </Paper>
  );
}
