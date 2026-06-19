import { Badge } from '@mantine/core';
import type { OrderStatus } from '../api/types';

const STATUS_COLOR: Record<OrderStatus, string> = {
  CRIADA: 'gray',
  PLANEJADA: 'blue',
  AGENDADA: 'yellow',
  EM_TRANSPORTE: 'violet',
  ENTREGUE: 'green',
};

export const statusColor = (status: OrderStatus) => STATUS_COLOR[status];

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge color={STATUS_COLOR[status]} variant="light">
      {status}
    </Badge>
  );
}
