import {
  Badge,
  Button,
  Card,
  Center,
  Code,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useAuditTrail } from "../api/hooks";
import type { AuditLog } from "../api/types";

const ACTIONS = [
  "ORDER_CREATED",
  "STATUS_CHANGED",
  "SCHEDULE_CHANGED",
  "TRANSPORT_CHANGED",
];

const ACTION_COLOR: Record<string, string> = {
  ORDER_CREATED: "green",
  STATUS_CHANGED: "blue",
  SCHEDULE_CHANGED: "yellow",
  TRANSPORT_CHANGED: "violet",
};

export function AuditPage() {
  const [action, setAction] = useState<string | null>(null);
  const { data, isLoading } = useAuditTrail(action ?? undefined);

  const [opened, { open, close }] = useDisclosure(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const openDetails = (log: AuditLog) => {
    setSelected(log);
    open();
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Auditoria</Title>
        <Text c="dimmed" size="sm">
          Trilha de eventos relevantes do sistema (criação de OV, status, agendamento, transporte).
        </Text>
      </div>

      <Card withBorder padding="md" radius="md">
        <Select
          label="Tipo de ação"
          placeholder="Todas"
          clearable
          w={240}
          data={ACTIONS.map((a) => ({ value: a, label: a }))}
          value={action}
          onChange={setAction}
        />
      </Card>

      <Card withBorder padding={0} radius="md">
        {isLoading ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : !data || data.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhum evento de auditoria.
          </Text>
        ) : (
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Data/hora</Table.Th>
                <Table.Th>Ação</Table.Th>
                <Table.Th>Entidade</Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{new Date(log.createdAt).toLocaleString("pt-BR")}</Table.Td>
                  <Table.Td>
                    <Badge color={ACTION_COLOR[log.action] ?? "gray"} variant="light">
                      {log.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{log.entity}</Table.Td>
                  <Table.Td>
                    <Text size="xs" ff="monospace" c="dimmed">
                      {log.entityId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Button variant="subtle" size="xs" onClick={() => openDetails(log)}>
                      ver estados
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="Detalhes do evento" centered size="lg">
        {selected && (
          <Stack gap="sm">
            <Group gap="xs">
              <Badge color={ACTION_COLOR[selected.action] ?? "gray"} variant="light">
                {selected.action}
              </Badge>
              <Text size="sm" c="dimmed">
                {new Date(selected.createdAt).toLocaleString("pt-BR")}
              </Text>
            </Group>
            <Text size="sm">
              <b>Entidade:</b> {selected.entity} · <b>ID:</b> {selected.entityId}
            </Text>
            <div>
              <Text size="sm" fw={600} mb={4}>
                Estado anterior
              </Text>
              <Code block>{JSON.stringify(selected.previousState ?? null, null, 2)}</Code>
            </div>
            <div>
              <Text size="sm" fw={600} mb={4}>
                Estado posterior
              </Text>
              <Code block>{JSON.stringify(selected.newState ?? null, null, 2)}</Code>
            </div>
            {selected.metadata != null && (
              <div>
                <Text size="sm" fw={600} mb={4}>
                  Metadata
                </Text>
                <Code block>{JSON.stringify(selected.metadata, null, 2)}</Code>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
