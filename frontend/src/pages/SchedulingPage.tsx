import {
  Anchor,
  Badge,
  Card,
  Center,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { useSalesOrders } from '../api/hooks';
import { StatusBadge } from '../components/StatusBadge';

export function SchedulingPage() {
  const { data, isLoading } = useSalesOrders();

  const pending = data?.filter(
    (o) =>
      o.status === 'PLANEJADA' ||
      o.status === 'AGENDADA' ||
      (o.schedule && !o.schedule.confirmed),
  );

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Central de Agendamento</Title>
        <Text c="dimmed" size="sm">
          Ordens que aguardam definição ou confirmação de entrega.
        </Text>
      </div>

      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : !pending || pending.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhuma ordem aguardando agendamento.
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Agendamento</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pending.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td fw={600}>{o.code}</Table.Td>
                  <Table.Td>{o.client.name}</Table.Td>
                  <Table.Td>
                    <StatusBadge status={o.status} />
                  </Table.Td>
                  <Table.Td>
                    {o.schedule ? (
                      <Text component="span" size="sm">
                        {new Date(o.schedule.deliveryDate).toLocaleDateString('pt-BR')} ·{' '}
                        {o.schedule.windowStart}–{o.schedule.windowEnd}{' '}
                        <Badge
                          ml={6}
                          size="sm"
                          variant="light"
                          color={o.schedule.confirmed ? 'green' : 'yellow'}
                        >
                          {o.schedule.confirmed ? 'confirmado' : 'pendente'}
                        </Badge>
                      </Text>
                    ) : (
                      <Text c="dimmed" size="sm">
                        sem agendamento
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/orders/${o.id}`} size="sm">
                      gerenciar
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
