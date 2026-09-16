import { apiClient } from './client'

export interface SendOtpRequest {
  msisdn: string;
  operation?: string;
  topic: string;
}

export interface SendOtpResponse {
  status?: string | number;
  message?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export interface ValidateOtpRequest {
  otp: string;
  operation?: string;
  msisdn: string;
}

export interface ValidateOtpResponse {
  status?: string | number;
  message?: string;
  statusCode?: number;
  isValid?: boolean;
  [key: string]: unknown;
}

export const otpApi = {
  /**
   * Dispatches OTP to the user's registered MSISDN for a specific protected operation/topic.
   * Endpoint: POST /scm-db-api/masterdata-db-api/sendOtp
   * Payload: JSON body { msisdn, operation: '10069', topic }
   */
  sendOtp: async (request: SendOtpRequest): Promise<SendOtpResponse> => {
    return apiClient<SendOtpResponse>('/scm-db-api/masterdata-db-api/sendOtp', {
      method: 'POST',
      body: JSON.stringify({
        msisdn: request.msisdn,
        operation: request.operation || '10069',
        topic: request.topic,
      }),
    })
  },

  /**
   * Validates OTP token entered by the user.
   * Endpoint: POST /scm-db-api/masterdata-db-api/validateOtp?otp={otp}&operation=10069&msisdn={msisdn}
   * Query params: otp, operation, msisdn (matches the Postman collection specification)
   */
  validateOtp: async (request: ValidateOtpRequest): Promise<ValidateOtpResponse> => {
    const params = new URLSearchParams({
      otp: request.otp,
      operation: request.operation || '10069',
      msisdn: request.msisdn,
    })

    return apiClient<ValidateOtpResponse>(
      `/scm-db-api/masterdata-db-api/validateOtp?${params.toString()}`,
      {
        method: 'POST',
      }
    )
  },
}
