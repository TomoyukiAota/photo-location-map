/**
 * The data for tree view.
 */
import { NestedNode } from './directory-tree-view.model';

export const directoryTreeData: NestedNode[] = [
  {
    name: 'root',
    children: [
      {
        name: 'child1',
        children: [
          {
            name: 'child1-1',
            children: [
              {
                name: 'child1-1-1'
              },
              {
                name: 'child1-1-2'
              }
            ]
          },
          {
            name: 'child1-2'
          },
          {
            name: 'child1-3'
          }
        ]
      },
      {
        name: 'child2'
      }
    ]
  }
];

