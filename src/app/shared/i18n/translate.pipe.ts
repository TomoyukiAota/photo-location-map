import { Pipe, PipeTransform } from '@angular/core';
import { t } from '../../../../src-shared/i18n/i18n';
import { TranslationKey, TranslationValues } from '../../../../src-shared/i18n/translation-key';

/**
 * A text in the application's language: `{{ 'sidebar.openFolder' | t }}`, or with the values of its placeholders,
 * `{{ 'loadedFiles.loaded' | t: { count } }}`. Pure, as the language does not change while the application runs
 * (src-shared/i18n/i18n.ts). A production build checks the key (`strictTemplates`).
 */
@Pipe({ name: 't' })
export class TranslatePipe implements PipeTransform {
  public transform(key: TranslationKey, values?: TranslationValues): string {
    return t(key, values);
  }
}
