/**
 * The data for tree view.
 */
import { NestedNode } from './directory-tree-view.model';

export const directoryTreeData: NestedNode[] = [
  {
    name: 'root',
    isSelectable: true,
    children: [
      {
        name: 'child1',
        isSelectable: true,
        children: [
          {
            name: 'child1-1',
            isSelectable: true,
            children: [
              {
                name: 'child1-1-1.JPG',
                isSelectable: true
              },
              {
                name: 'child1-1-2.JPG',
                isSelectable: true
              }
            ]
          },
          {
            name: 'child1-2.JPG',
            isSelectable: true
          },
          {
            name: 'child1-3.txt',
            isSelectable: false
          }
        ]
      },
      {
        name: 'child2',
        isSelectable: false,
        children: [
          {
            name: 'child2-1.txt',
            isSelectable: false
          },
          {
            name: 'child2-2.txt',
            isSelectable: false
          }
        ]
      }
    ]
  }
];

