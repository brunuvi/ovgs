import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
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
  useCreateTransportType,
  useTransportTypes,
  useUpdateTransportType,
} from '../api/hooks';
import type { TransportType } from '../api/types';

export function TransportTypesPage() {
  const { data, isLoading } = useTransportTypes();
  const create = useCreateTransportType();
  const update = useUpdateTransportType();

  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<TransportType | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);

  const openCreate = () => {
    setEditing(null);
    setCode('');
    setName('');
    setActive(true);
    open();
  };

  const openEdit = (t: TransportType) => {
    setEditing(t);
    setCode(t.code);
    setName(t.name);
    setActive(t.active);
    open();
  };

  const submit = async () => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name, active });
        notifications.show({ color: 'green', title: 'Transporte atualizado', message: name });
      } else {
        await create.mutateAsync({ code: code.toUpperCase(), name });
        notifications.show({ color: 'green', title: 'Transporte criado', message: name });
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

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Tipos de Transporte</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Novo tipo
        </Button>
      </Group>

      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : !data || data.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhum tipo cadastrado.
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Ativo</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>
                    <Text ff="monospace" size="sm">
                      {t.code}
                    </Text>
                  </Table.Td>
                  <Table.Td>{t.name}</Table.Td>
                  <Table.Td>
                    <Badge color={t.active ? 'green' : 'gray'} variant="light">
                      {t.active ? 'sim' : 'não'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconPencil size={14} />}
                      onClick={() => openEdit(t)}
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
        title={editing ? 'Editar tipo de transporte' : 'Novo tipo de transporte'}
        centered
      >
        <Stack>
          <TextInput
            label="Código (ex: BITRUCK)"
            required
            disabled={!!editing}
            description={editing ? 'O código não pode ser alterado' : undefined}
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
          />
          <TextInput
            label="Nome"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          {editing && (
            <Switch
              label="Ativo"
              checked={active}
              onChange={(e) => setActive(e.currentTarget.checked)}
            />
          )}
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={!name || (!editing && !code)}
              loading={create.isPending || update.isPending}
            >
              Salvar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
