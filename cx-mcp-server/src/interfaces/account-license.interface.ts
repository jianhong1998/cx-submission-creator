/**
 * Interface representing a professional license for an account
 */
export interface ProfessionalLicense {
  /** Unique identifier for the professional license */
  uuid: string;

  /** Registrar organization (e.g., "PEB", "BOA") */
  registrar: string;

  /** Registration number for the professional license */
  regNumber: string;

  /** ISO date string indicating when the license is valid until */
  valid: string;

  /** Specialty field (e.g., "Mechanical") or null if not applicable */
  specialty: string | null;
}

/**
 * Interface representing available roles for account licenses
 */
export interface AvailableRole {
  /** Key identifier for the role (e.g., "developer", "transportConsultant") */
  roleKey: string;

  /** Registration number associated with the role, or null if not applicable */
  regNumber: string | null;
}

/**
 * Interface representing an account license with all associated data
 */
export interface AccountLicense {
  /** Unique identifier for the account */
  accountUuid: string;

  /** Display name for the account */
  accountName: string;

  /** Identification number for the account */
  identificationNumber: string;

  /** Company UEN (Unique Entity Number), optional field */
  accountCompanyUEN?: string;

  /** Array of professional licenses associated with this account */
  professionalLicenses: ProfessionalLicense[];

  /** Array of available roles for this account's licenses */
  availableRolesForAccountLicenses: AvailableRole[];
}

/**
 * Interface for successful response from the account licenses endpoint
 */
export interface AccountLicensesSuccessResponse {
  /** Indicates successful response */
  success: true;

  /** Array of account license data */
  data: AccountLicense[];
}

/**
 * Interface for error response from the account licenses endpoint
 */
export interface AccountLicensesErrorResponse {
  /** Indicates error response */
  success: false;

  /** Error details */
  error: {
    /** Type of error (CLIENT_ERROR, SERVER_ERROR, NETWORK_ERROR) */
    type: 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR';

    /** HTTP status code */
    statusCode: number;

    /** Human-readable error message */
    message: string;

    /** Additional error details, if available */
    details?: any;
  };
}

/**
 * Union type for all possible responses from the account licenses endpoint
 */
export type AccountLicensesResponse =
  | AccountLicensesSuccessResponse
  | AccountLicensesErrorResponse;

/**
 * Type for the raw API response from the external service
 * This matches the exact structure returned by the endpoint
 */
export type RawAccountLicensesResponse = AccountLicense[];

/**
 * Interface for authentication error responses (403 Forbidden)
 */
export interface AuthenticationErrorResponse {
  /** ISO timestamp of when the error occurred */
  timestamp: string;

  /** Indicates error response */
  success: false;

  /** HTTP status code */
  status: 403;

  /** Error message */
  message: 'NOT_LOGGED_IN';

  /** Error code */
  errorCode: 'NOT_LOGGED_IN';

  /** Full error stack trace (in development environment) */
  stack: string;
}
