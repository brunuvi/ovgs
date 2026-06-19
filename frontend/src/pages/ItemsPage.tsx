import {
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useCreateItem, useItems } from '../api/hooks';

export function ItemsPage() {
  const { data, isLoading } = useItems();
  const create = useCreateItem();

  const [opened, { open, close }] = useDisclosure(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('UN');

  const openCreate = () => {
    setSku('');
    setName('');
    setUnit('UN');
    open();
  };

  const submit = async () => {
    try {
      await create.mutateAsync({ sku, name, unit });
      notifications.show({ color: 'green', title: 'Item criado', message: `${sku} — ${name}` });
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
        <Title order={2}>Itens</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Novo item
        </Button>
      </Group>

      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : !data || data.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhum item cadastrado.
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Unidade</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((it) => (
                <Table.Tr key={it.id}>
                  <Table.Td>
                    <Text ff="monospace" size="sm">
                      {it.sku}
                    </Text>
                  </Table.Td>
                  <Table.Td>{it.name}</Table.Td>
                  <Table.Td>{it.unit}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="Novo item" centered>
        <Stack>
          <TextInput
            label="SKU"
            required
            value={sku}
            onChange={(e) => setSku(e.currentTarget.value)}
          />
          <TextInput
            label="Nome"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextInput
            label="Unidade"
            value={unit}
            onChange={(e) => setUnit(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={close}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!sku || !name} loading={create.isPending}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
