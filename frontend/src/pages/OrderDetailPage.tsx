import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useAuditLogs,
  useConfirmSchedule,
  useCreateSchedule,
  useReschedule,
  useSalesOrder,
  useUpdateStatus,
} from '../api/hooks';
import { ORDER_STATUS_FLOW } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 ? '30' : '00';
  return `${h}:${m}`;
});

const notifyError = (err: unknown) =>
  notifications.show({
    color: 'red',
    title: 'Operação não permitida',
    message: err instanceof Error ? err.message : 'Erro inesperado.',
  });

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useSalesOrder(id);
  const { data: logs } = useAuditLogs(id);
  const updateStatus = useUpdateStatus();
  const createSchedule = useCreateSchedule();
  const confirmSchedule = useConfirmSchedule();
  const reschedule = useReschedule();

  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [windowStart, setWindowStart] = useState('08:00');
  const [windowEnd, setWindowEnd] = useState('12:00');
  const [rescheduling, setRescheduling] = useState(false);

  if (isLoading || !order) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const nextStatus = ORDER_STATUS_FLOW[currentIdx + 1];

  const advance = () =>
    updateStatus.mutate(
      { id: order.id, status: nextStatus },
      {
        onSuccess: () =>
          notifications.show({
            color: 'green',
            title: 'Status atualizado',
            message: `Ordem movida para ${nextStatus}.`,
          }),
        onError: notifyError,
      },
    );

  const saveSchedule = () =>
    createSchedule.mutate(
      {
        id: order.id,
        deliveryDate: deliveryDate!.toISOString().slice(0, 10),
        windowStart,
        windowEnd,
      },
      {
        onSuccess: () =>
          notifications.show({ color: 'green', title: 'Agendamento criado', message: 'Confirme o agendamento para mover a ordem para AGENDADA.' }),
        onError: notifyError,
      },
    );

  const startReschedule = () => {
    if (!order.schedule) return;
    setDeliveryDate(new Date(order.schedule.deliveryDate));
    setWindowStart(order.schedule.windowStart);
    setWindowEnd(order.schedule.windowEnd);
    setRescheduling(true);
  };

  const doReschedule = () =>
    reschedule.mutate(
      {
        id: order.id,
        deliveryDate: deliveryDate ? deliveryDate.toISOString().slice(0, 10) : undefined,
        windowStart,
        windowEnd,
      },
      {
        onSuccess: () => {
          setRescheduling(false);
          notifications.show({ color: 'blue', title: 'Reagendado', message: 'A confirmação anterior foi invalidada.' });
        },
        onError: notifyError,
      },
    );

  return (
    <Stack gap="lg">
      <Anchor component={Link} to="/orders" c="dimmed" size="sm">
        <Group gap={4}>
          <IconArrowLeft size={14} /> Voltar para Ordens
        </Group>
      </Anchor>

      <Group gap="sm">
        <Title order={2}>{order.code}</Title>
        <StatusBadge status={order.status} />
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Title order={4} mb="sm">
              Dados
            </Title>
            <Stack gap={6}>
              <Text size="sm">
                <b>Cliente:</b> {order.client.name}
              </Text>
              <Text size="sm">
                <b>Transporte:</b> {order.transportType.name}
              </Text>
              <Text size="sm">
                <b>Criada em:</b> {new Date(order.createdAt).toLocaleString('pt-BR')}
              </Text>
            </Stack>

            <Title order={5} mt="lg" mb="xs">
              Itens
            </Title>
            <Table>
              <Table.Tbody>
                {order.items.map((i) => (
                  <Table.Tr key={i.id}>
                    <Table.Td>
                      <Text size="sm">{i.item.sku}</Text>
                      <Text size="xs" c="dimmed">
                        {i.item.name}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      {i.quantity} {i.item.unit}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Title order={4} mb="md">
              Fluxo de status
            </Title>
            <Timeline active={currentIdx} bulletSize={20} lineWidth={2}>
              {ORDER_STATUS_FLOW.map((s) => (
                <Timeline.Item key={s} title={<Badge size="sm" variant={s === order.status ? 'filled' : 'light'}>{s}</Badge>} />
              ))}
            </Timeline>

            {nextStatus ? (
              <Button
                mt="md"
                fullWidth
                onClick={advance}
                loading={updateStatus.isPending}
              >
                Avançar para {nextStatus}
              </Button>
            ) : (
              <Alert mt="md" color="green" icon={<IconCheck size={18} />}>
                Ordem entregue — fluxo concluído.
              </Alert>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Agendamento
        </Title>
        {order.schedule && !rescheduling ? (
          <Group justify="space-between" align="center">
            <Stack gap={4}>
              <Text size="sm">
                <b>Entrega:</b>{' '}
                {new Date(order.schedule.deliveryDate).toLocaleDateString('pt-BR')} ·{' '}
                {order.schedule.windowStart}–{order.schedule.windowEnd}
              </Text>
              <Group gap="xs">
                <Text size="sm">
                  <b>Confirmado:</b>
                </Text>
                <Badge color={order.schedule.confirmed ? 'green' : 'yellow'} variant="light">
                  {order.schedule.confirmed ? 'sim' : 'pendente'}
                </Badge>
              </Group>
            </Stack>
            <Group>
              {!order.schedule.confirmed && (
                <Button
                  onClick={() =>
                    confirmSchedule.mutate(order.id, {
                      onSuccess: () =>
                        notifications.show({ color: 'green', title: 'Agendamento confirmado', message: 'A ordem foi movida para AGENDADA.' }),
                      onError: notifyError,
                    })
                  }
                >
                  Confirmar
                </Button>
              )}
              <Button variant="default" onClick={startReschedule}>
                Reagendar
              </Button>
            </Group>
          </Group>
        ) : (
          <Group align="end" gap="sm">
            <DatePickerInput
              label="Data de entrega"
              placeholder="Selecione"
              valueFormat="DD/MM/YYYY"
              value={deliveryDate}
              onChange={(d) => setDeliveryDate(d as Date | null)}
              w={180}
            />
            <Select
              label="Início"
              data={TIME_OPTIONS}
              value={windowStart}
              onChange={(v) => v && setWindowStart(v)}
              allowDeselect={false}
              w={110}
            />
            <Select
              label="Fim"
              data={TIME_OPTIONS}
              value={windowEnd}
              onChange={(v) => v && setWindowEnd(v)}
              allowDeselect={false}
              w={110}
            />
            {rescheduling ? (
              <>
                <Button onClick={doReschedule} disabled={!deliveryDate} loading={reschedule.isPending}>
                  Salvar reagendamento
                </Button>
                <Button variant="subtle" color="gray" onClick={() => setRescheduling(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={saveSchedule} disabled={!deliveryDate} loading={createSchedule.isPending}>
                Agendar entrega
              </Button>
            )}
          </Group>
        )}
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Trilha de auditoria
        </Title>
        {!logs || logs.length === 0 ? (
          <Text c="dimmed" size="sm">
            Sem eventos.
          </Text>
        ) : (
          <Timeline bulletSize={16} lineWidth={2} active={logs.length}>
            {logs.map((log) => (
              <Timeline.Item
                key={log.id}
                title={<Text size="sm" fw={600}>{log.action}</Text>}
              >
                <Text size="xs" c="dimmed">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>
    </Stack>
  );
}
