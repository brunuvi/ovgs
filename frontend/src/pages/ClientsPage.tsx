import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import {
  useClients,
  useCreateClient,
  useTransportTypes,
  useUpdateClient,
} from '../api/hooks';
import type { Client } from '../api/types';

interface FormState {
  name: string;
  document: string;
  active: boolean;
  authorizedTransportTypeIds: string[];
}

const empty: FormState = {
  name: '',
  document: '',
  active: true,
  authorizedTransportTypeIds: [],
};

export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const { data: transports } = useTransportTypes();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    open();
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name,
      document: c.document,
      active: c.active,
      authorizedTransportTypeIds: c.authorizedTransports.map((a) => a.transportTypeId),
    });
    open();
  };

  const submit = async () => {
    try {
      if (editing) {
        await updateClient.mutateAsync({ id: editing.id, ...form });
        notifications.show({ color: 'green', title: 'Cliente atualizado', message: form.name });
      } else {
        await createClient.mutateAsync({
          name: form.name,
          document: form.document,
          authorizedTransportTypeIds: form.authorizedTransportTypeIds,
        });
        notifications.show({ color: 'green', title: 'Cliente criado', message: form.name });
      }
      close();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Erro ao salvar',
        message: err instanceof Error ? err.message : 'Erro inesperado.',
      });
    }
  };

  const transportOptions = (transports ?? []).map((t) => ({ value: t.id, label: t.name }));
  const saving = createClient.isPending || updateClient.isPending;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Clientes</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Novo cliente
        </Button>
      </Group>

      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : !clients || clients.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhum cliente cadastrado.
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Documento</Table.Th>
                <Table.Th>Transportes autorizados</Table.Th>
                <Table.Th>Ativo</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {clients.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td fw={600}>{c.name}</Table.Td>
                  <Table.Td>{c.document}</Table.Td>
                  <Table.Td>
                    {c.authorizedTransports.length === 0 ? (
                      <Text c="dimmed" size="sm">
                        nenhum
                      </Text>
                    ) : (
                      <Group gap={4}>
                        {c.authorizedTransports.map((a) => (
                          <Badge key={a.transportTypeId} variant="light" size="sm">
                            {a.transportType.name}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={c.active ? 'green' : 'gray'} variant="light">
                      {c.active ? 'sim' : 'não'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                      onClick={() => openEdit(c)}
                    >
                      Editar
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        centered
      >
        <Stack>
          <TextInput
            label="Nome"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Documento (CNPJ/CPF)"
            required
            value={form.document}
            onChange={(e) => setForm({ ...form, document: e.currentTarget.value })}
          />
          <MultiSelect
            label="Transportes autorizados"
            placeholder="Selecione"
            data={transportOptions}
            value={form.authorizedTransportTypeIds}
            onChange={(v) => setForm({ ...form, authorizedTransportTypeIds: v })}
            searchable
            clearable
          />
          {editing && (
            <Switch
              label="Cliente ativo"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.currentTarget.checked })}
            />
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!form.name || !form.document} loading={saving}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
