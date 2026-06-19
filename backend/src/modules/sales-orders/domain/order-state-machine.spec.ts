import { OrderStatus } from '@prisma/client';
import {
  InvalidStatusTransitionError,
  OrderStateMachine,
} from './order-state-machine';

describe('OrderStateMachine', () => {
  describe('valid transitions (linear flow)', () => {
    const validPairs: [OrderStatus, OrderStatus][] = [
      [OrderStatus.CRIADA, OrderStatus.PLANEJADA],
      [OrderStatus.PLANEJADA, OrderStatus.AGENDADA],
      [OrderStatus.AGENDADA, OrderStatus.EM_TRANSPORTE],
      [OrderStatus.EM_TRANSPORTE, OrderStatus.ENTREGUE],
    ];

    it.each(validPairs)('allows %s → %s', (from, to) => {
      expect(OrderStateMachine.canTransition(from, to)).toBe(true);
      expect(() => OrderStateMachine.assertTransition(from, to)).not.toThrow();
    });
  });

  describe('invalid transitions', () => {
    it('rejects skipping steps (CRIADA → AGENDADA)', () => {
      expect(
        OrderStateMachine.canTransition(
          OrderStatus.CRIADA,
          OrderStatus.AGENDADA,
        ),
      ).toBe(false);
    });

    it('rejects moving backwards (AGENDADA → PLANEJADA)', () => {
      expect(
        OrderStateMachine.canTransition(
          OrderStatus.AGENDADA,
          OrderStatus.PLANEJADA,
        ),
      ).toBe(false);
    });

    it('rejects transitions from the terminal state (ENTREGUE)', () => {
      expect(OrderStateMachine.isTerminal(OrderStatus.ENTREGUE)).toBe(true);
      expect(OrderStateMachine.nextStates(OrderStatus.ENTREGUE)).toEqual([]);
    });

    it('throws InvalidStatusTransitionError with a descriptive message', () => {
      expect(() =>
        OrderStateMachine.assertTransition(
          OrderStatus.CRIADA,
          OrderStatus.ENTREGUE,
        ),
      ).toThrow(InvalidStatusTransitionError);
    });
  });

  describe('nextStates', () => {
    it('returns the next state in the flow', () => {
      expect(OrderStateMachine.nextStates(OrderStatus.CRIADA)).toEqual([
        OrderStatus.PLANEJADA,
      ]);
    });
  });
});
