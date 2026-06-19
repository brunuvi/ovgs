export type OrderStatus =
  | 'CRIADA'
  | 'PLANEJADA'
  | 'AGENDADA'
  | 'EM_TRANSPORTE'
  | 'ENTREGUE';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'CRIADA',
  'PLANEJADA',
  'AGENDADA',
  'EM_TRANSPORTE',
  'ENTREGUE',
];

export interface TransportType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  active: boolean;
  authorizedTransports: {
    transportTypeId: string;
    transportType: TransportType;
  }[];
}

export interface Schedule {
  id: string;
  salesOrderId: string;
  deliveryDate: string;
  windowStart: string;
  windowEnd: string;
  confirmed: boolean;
}

export interface SalesOrderItem {
  id: string;
  quantity: number;
  item: Item;
}

export interface SalesOrder {
  id: string;
  code: string;
  status: OrderStatus;
  clientId: string;
  transportTypeId: string;
  createdAt: string;
  client: Client;
  transportType: TransportType;
  items: SalesOrderItem[];
  schedule: Schedule | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  previousState: unknown;
  newState: unknown;
  metadata: unknown;
  createdAt: string;
}
