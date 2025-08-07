/**
 * Interface representing session data from HTTP cookies
 */
export interface SessionData {
  /** Primary session cookie value (cnx) */
  cnx: string;

  /** Session expiration timestamp from cookie */
  cnxExpires: string;

  /** Account UUID associated with the session */
  accountUuid: string;
}

/**
 * Interface for successful authentication response
 */
export interface AuthenticationSuccessResponse {
  /** Indicates successful response */
  success: true;

  /** Authentication response data */
  data: {
    /** Account UUID that was authenticated */
    accountUuid: string;

    /** Session cookies extracted from authentication response */
    sessionCookies: {
      /** Main session cookie value (cnx) */
      cnx: string;
      /** Session expiration timestamp (cnxExpires) */
      cnxExpires: string;
    };

    /** Redirect URL from 302 response */
    redirectLocation: string;

    /** Success message */
    message: string;
  };

  /** Operation identifier */
  operation: 'login_as_user';

  /** Response timestamp */
  timestamp: string;
}

/**
 * Interface for authentication error response
 */
export interface AuthenticationErrorResponse {
  /** Indicates error response */
  success: false;

  /** Error details */
  error: {
    /** Type of error */
    type: 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR';

    /** HTTP status code */
    statusCode: number;

    /** Human-readable error message */
    message: string;

    /** Additional error details, if available */
    details?: unknown;
  };

  /** Operation identifier */
  operation: 'login_as_user';

  /** Response timestamp */
  timestamp: string;
}

/**
 * Union type for all possible authentication responses
 */
export type AuthenticationResponse =
  | AuthenticationSuccessResponse
  | AuthenticationErrorResponse;

/**
 * Interface representing raw HTTP response from authentication endpoint
 */
export interface RawAuthenticationResponse {
  /** HTTP status code */
  status: number;

  /** Response headers including Set-Cookie */
  headers: Headers;

  /** Response body (typically redirect HTML) */
  body: string;

  /** Redirect location from Location header */
  location?: string;
}
