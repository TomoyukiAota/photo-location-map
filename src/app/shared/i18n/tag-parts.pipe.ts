import { Pipe, PipeTransform } from '@angular/core';
import { splitAtTag, TagParts } from '../../../../src-shared/i18n/tagged-text';

/**
 * The parts of a translated sentence with a link, for a template to put its own `<a>` around the linked words:
 *
 *     @let parts = 'appInfo.troubleshooting' | t | tagParts: 'pageLink';
 *     {{ parts.before }}<a href="" #link>{{ parts.inside }}</a>{{ parts.after }}
 */
@Pipe({ name: 'tagParts' })
export class TagPartsPipe implements PipeTransform {
  public transform(text: string, tag: string): TagParts {
    return splitAtTag(text, tag);
  }
}
