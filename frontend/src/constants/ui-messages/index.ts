/**
 * UIメッセージ定数
 *
 * アプリケーション全体で使用される汎用的なUIテキストを一元管理
 *
 * @example
 * import { COMMON, AUTH } from '@/constants/ui-messages';
 * <button>{COMMON.BUTTONS.SAVE}</button>
 * <button>{AUTH.LOGIN.BUTTONS.SUBMIT}</button>
 */

export { COMMON } from './common';
export { AUTH } from './auth';
export type {
  CommonButton,
  CommonStatus,
  CommonValidation,
  CommonFallbackError,
  CommonAriaLabel,
  AuthLogoutButton,
  AuthLoginButton,
  AuthRegisterButton,
  AuthCommonLabel,
} from './types';
