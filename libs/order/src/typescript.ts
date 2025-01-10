export interface OrderDescription {
  userId: bigint
  currency: string
  items: OrderItem[]
}

export interface OrderItem {
  label: string
  price: number
  creditAmount?: number
  specialActions?: string | string[]
}

export interface OrderNumberGeneratorStrategyOptions {
  date?: Date
  length?: number
  preferredLength?: number
}

export interface VariableGeneratorFactory {
  /**
   * Returns the next number in sequence based on the input.
   * The generation is always done by a deterministic algorithm.
   */
  generate: (last: string) => string

  /** Generate the first variable, if last does not exist. */
  getFirst: () => string
}

export interface OrderLogProps {
  orderId: bigint
  message: string
  level: keyof typeof ORDER_LOG_LEVEL
}

export const ORDER_LOG_LEVEL = {
  info: 1,
  success: 2,
  warning: 3,
  error: 4,
}
