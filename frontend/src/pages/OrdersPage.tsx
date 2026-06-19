import {
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFilterOff, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useClients,
  useSalesOrders,
  useTransportTypes,
  type OrderFilters,
} from '../api/hooks';
import { ORDER_STATUS_FLOW } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

const toIso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

export function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({});
  const { data, isLoading } = useSalesOrders(filters);
  const { data: clients } = useClients();
  const { data: transports } = useTransportTypes();

  const set = (patch: Partial<OrderFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Ordens de Venda</Title>
        <Button component={Link} to="/orders/new" leftSection={<IconPlus size={16} />}>
          Nova Ordem
        </Button>
      </Group>

      <Card withBorder padding="md" radius="md">
        <Group align="end" gap="sm">
          <Select
            label="Status"
            placeholder="Todos"
            clearable
            data={ORDER_STATUS_FLOW.map((s) => ({ value: s, label: s }))}
            value={filters.status ?? null}
            onChange={(v) => set({ status: v ?? undefined })}
            w={160}
          />
          <Select
            label="Cliente"
            placeholder="Todos"
            clearable
            searchable
            data={(clients ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={filters.clientId ?? null}
            onChange={(v) => set({ clientId: v ?? undefined })}
            w={200}
          />
          <Select
            label="Transporte"
            placeholder="Todos"
            clearable
            data={(transports ?? []).map((t) => ({ value: t.id, label: t.name }))}
            value={filters.transportTypeId ?? null}
            onChange={(v) => set({ transportTypeId: v ?? undefined })}
            w={170}
          />
          <DatePickerInput
            label="De"
            placeholder="Data inicial"
            clearable
            valueFormat="DD/MM/YYYY"
            onChange={(d) => set({ dateFrom: toIso(d as Date | null) })}
            w={150}
          />
          <DatePickerInput
            label="Até"
            placeholder="Data final"
            clearable
            valueFormat="DD/MM/YYYY"
            onChange={(d) => set({ dateTo: toIso(d as Date | null) })}
            w={150}
          />
          {hasFilters && (
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconFilterOff size={16} />}
              onClick={() => setFilters({})}
            >
              Limpar
            </Button>
          )}
        </Group>
      </Card>

      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : !data || data.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {hasFilters
              ? 'Nenhuma ordem para os filtros selecionados.'
              : 'Nenhuma Ordem de Venda cadastrada.'}
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Transporte</Table.Th>
                <Table.Th>Itens</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Criada</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td fw={600}>{o.code}</Table.Td>
                  <Table.Td>{o.client.name}</Table.Td>
                  <Table.Td>{o.transportType.name}</Table.Td>
                  <Table.Td>{o.items.length}</Table.Td>
                  <Table.Td>
                    <StatusBadge status={o.status} />
                  </Table.Td>
                  <Table.Td c="dimmed">
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')}
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
