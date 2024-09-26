export type OperationClass = 'A' | 'B' | 'C'

export interface ExtendedRequest extends Request {
  requestId: string
  apiKey?: string
}

export interface ApiKeyReportUsageRequest {
  request: Request
  apiKey?: string
  operationClass?: OperationClass
  spend?: number | bigint
  metaData?: object
}

export interface ApiUsageReport {
  operation: OperationClass
  spend: number
  operations: number
}

export type ApiUsageRequest = ({ organisationId: number } | { userId: number } | { apiKey: string }) & {
  dateFrom?: Date
  dateTo?: Date
}