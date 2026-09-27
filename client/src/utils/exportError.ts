import type { TranslationKey } from '../i18n/translations';

/** An export error with a user-facing, translatable explanation. */
export class ExportError extends Error {
  code: TranslationKey;

  constructor(code: TranslationKey, detail?: string) {
    super(detail ?? code);
    this.code = code;
  }
}
