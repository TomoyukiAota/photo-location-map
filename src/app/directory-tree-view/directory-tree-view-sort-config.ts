export const DirectoryTreeViewSortKey_Name = 'Name';
export const DirectoryTreeViewSortKey_ShootingDateTime = 'ShootingDateTime';

// Suppress the "error 'DirectoryTreeViewSortKey_List' is assigned a value but only used as a type" by @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DirectoryTreeViewSortKey_List = [
  DirectoryTreeViewSortKey_Name,
  DirectoryTreeViewSortKey_ShootingDateTime,
] as const;

export type DirectoryTreeViewSortKey = typeof DirectoryTreeViewSortKey_List[number];

export const DirectoryTreeViewSortDirection_Ascending = 'Ascending';
export const DirectoryTreeViewSortDirection_Descending = 'Descending';

// Suppress the "error 'DirectoryTreeViewSortDirection_List' is assigned a value but only used as a type" by @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DirectoryTreeViewSortDirection_List = [
  DirectoryTreeViewSortDirection_Ascending,
  DirectoryTreeViewSortDirection_Descending,
] as const;

export type DirectoryTreeViewSortDirection = typeof DirectoryTreeViewSortDirection_List[number];

export class DirectoryTreeViewSortConfig {
  public key: DirectoryTreeViewSortKey;
  public direction: DirectoryTreeViewSortDirection;
}
