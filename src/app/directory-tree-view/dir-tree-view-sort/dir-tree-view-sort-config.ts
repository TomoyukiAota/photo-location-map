export const DirTreeViewSortKey_Name = 'Name';
export const DirTreeViewSortKey_ShootingTime = 'ShootingTime';

// Suppress the "error 'DirTreeViewSortKey_List' is assigned a value but only used as a type" by @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DirTreeViewSortKey_List = [
  DirTreeViewSortKey_Name,
  DirTreeViewSortKey_ShootingTime,
] as const;

export type DirTreeViewSortKey = typeof DirTreeViewSortKey_List[number];

export const DirTreeViewSortDirection_Ascending = 'Ascending';
export const DirTreeViewSortDirection_Descending = 'Descending';

// Suppress the "error 'DirTreeViewSortDirection_List' is assigned a value but only used as a type" by @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DirTreeViewSortDirection_List = [
  DirTreeViewSortDirection_Ascending,
  DirTreeViewSortDirection_Descending,
] as const;

export type DirTreeViewSortDirection = typeof DirTreeViewSortDirection_List[number];

export class DirTreeViewSortConfig {
  constructor(public readonly key: DirTreeViewSortKey,
              public readonly direction: DirTreeViewSortDirection,
  ) {
  }
}

export const defaultDirTreeViewSortConfig = new DirTreeViewSortConfig(DirTreeViewSortKey_Name, DirTreeViewSortDirection_Ascending);
