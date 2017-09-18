import {
  Rule,
  chain,
  template,
} from '@angular-devkit/schematics';

import { Schema as PageOptions } from './schema';

export default function(options: PageOptions): Rule {
  const { name } = options;

  return (tree, ctx) => {
    tree.create(name, 'test');

    return chain([
      template({}),
    ])(tree, ctx);
  };
}
