import { OrderStatus } from '@prisma/client';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CRIADA]: [OrderStatus.PLANEJADA],
  [OrderStatus.PLANEJADA]: [OrderStatus.AGENDADA],
  [OrderStatus.AGENDADA]: [OrderStatus.EM_TRANSPORTE],
  [OrderStatus.EM_TRANSPORTE]: [OrderStatus.ENTREGUE],
  [OrderStatus.ENTREGUE]: [],
};

export const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.CRIADA,
  OrderStatus.PLANEJADA,
  OrderStatus.AGENDADA,
  OrderStatus.EM_TRANSPORTE,
  OrderStatus.ENTREGUE,
];

export class InvalidStatusTransitionError extends Error {
  constructor(
    public readonly from: OrderStatus,
    public readonly to: OrderStatus,
  ) {
    super(
      `Invalid status transition: ${from} → ${to}. ` +
        `Allowed transitions from ${from}: ` +
        `${TRANSITIONS[from].join(', ') || '(none — terminal state)'}.`,
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

export class OrderStateMachine {
  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  static nextStates(from: OrderStatus): OrderStatus[] {
    return TRANSITIONS[from] ?? [];
  }

  static isTerminal(status: OrderStatus): boolean {
    return TRANSITIONS[status]?.length === 0;
  }

  static assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStatusTransitionError(from, to);
    }
  }
}
