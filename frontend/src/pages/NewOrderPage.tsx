import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients, useCreateOrder, useItems } from '../api/hooks';

export function NewOrderPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const { data: items } = useItems();
  const createOrder = useCreateOrder();

  const [clientId, setClientId] = useState<string | null>(null);
  const [transportTypeId, setTransportTypeId] = useState<string | null>(null);
  const [lines, setLines] = useState<{ itemId: string | null; quantity: number }[]>([
    { itemId: null, quantity: 1 },
  ]);

  const selectedClient = clients?.find((c) => c.id === clientId);

  const allowedTransports = useMemo(
    () => selectedClient?.authorizedTransports.map((a) => a.transportType) ?? [],
    [selectedClient],
  );

  const canSubmit =
    clientId &&
    transportTypeId &&
    lines.length > 0 &&
    lines.every((l) => l.itemId && l.quantity > 0);

  const submit = async () => {
    try {
      const order = await createOrder.mutateAsync({
        clientId: clientId!,
        transportTypeId: transportTypeId!,
        items: lines.map((l) => ({ itemId: l.itemId!, quantity: l.quantity })),
      });
      notifications.show({
        color: 'green',
        title: 'Ordem criada',
        message: `${order.code} criada com sucesso.`,
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Não foi possível criar a ordem',
        message: err instanceof Error ? err.message : 'Erro inesperado.',
      });
    }
  };

  if (isLoading) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    );
  }

  const noClients = !clients || clients.length === 0;
  const noItems = !items || items.length === 0;

  return (
    <Stack gap="lg" maw={680}>
      <Title order={2}>Nova Ordem de Venda</Title>

      {(noClients || noItems) && (
        <Alert color="yellow" icon={<IconAlertTriangle size={18} />} title="Pré-requisitos">
          Para criar uma ordem você precisa de pelo menos um{' '}
          {noClients && (
            <>
              <Anchor component={Link} to="/clients">
                cliente
              </Anchor>
              {noItems ? ' e um ' : ''}
            </>
          )}
          {noItems && (
            <Anchor component={Link} to="/items">
              item
            </Anchor>
          )}{' '}
          cadastrado.
        </Alert>
      )}

      <Card withBorder padding="lg" radius="md">
        <Stack>
          <Select
            label="Cliente"
            placeholder="Selecione o cliente"
            required
            searchable
            data={(clients ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={clientId}
            onChange={(v) => {
              setClientId(v);
              setTransportTypeId(null);
            }}
          />

          <Select
            label="Tipo de transporte"
            description="Apenas transportes autorizados para o cliente são exibidos"
            placeholder={clientId ? 'Selecione o transporte' : 'Escolha um cliente primeiro'}
            required
            disabled={!clientId}
            data={allowedTransports.map((t) => ({ value: t.id, label: t.name }))}
            value={transportTypeId}
            onChange={setTransportTypeId}
            error={
              clientId && allowedTransports.length === 0
                ? 'Este cliente não possui transportes autorizados (configure em Clientes).'
                : undefined
            }
          />

          <div>
            <Text fw={500} size="sm" mb="xs">
              Itens
            </Text>
            <Stack gap="xs">
              {lines.map((line, idx) => (
                <Group key={idx} align="end" gap="xs" wrap="nowrap">
                  <Select
                    flex={1}
                    placeholder="Selecione um item"
                    searchable
                    data={(items ?? []).map((it) => ({
                      value: it.id,
                      label: `${it.sku} — ${it.name}`,
                    }))}
                    value={line.itemId}
                    onChange={(v) =>
                      setLines((ls) =>
                        ls.map((l, i) => (i === idx ? { ...l, itemId: v } : l)),
                      )
                    }
                  />
                  <NumberInput
                    w={110}
                    min={1}
                    value={line.quantity}
                    onChange={(v) =>
                      setLines((ls) =>
                        ls.map((l, i) =>
                          i === idx ? { ...l, quantity: Number(v) || 1 } : l,
                        ),
                      )
                    }
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
            <Button
              variant="light"
              size="xs"
              mt="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => setLines((ls) => [...ls, { itemId: null, quantity: 1 }])}
            >
              Adicionar item
            </Button>
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="default" component={Link} to="/orders">
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!canSubmit} loading={createOrder.isPending}>
              Criar Ordem
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
