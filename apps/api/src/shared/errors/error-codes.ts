import { ERROR_CODES } from '@roomly/shared';

export { ERROR_CODES };
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
