import type { HouseResourceTreeNode } from '@/types/api';

export type TreeNodeWithMeta = HouseResourceTreeNode & {
  name?: string;
  externalId?: string;
};

export function flattenResources(
  nodes: TreeNodeWithMeta[],
  parentPath = '',
): Array<{ id: string; type: string; name?: string; path: string }> {
  const result: Array<{ id: string; type: string; name?: string; path: string }> = [];
  nodes.forEach((node) => {
    const id = String(node.id);
    const type = typeof node.type === 'string' ? node.type : 'RESOURCE';
    const label = node.name ?? node.externalId ?? type;
    const path = parentPath ? `${parentPath} / ${label}` : label;
    result.push({ id, type, name: node.name, path });
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...flattenResources(node.children as TreeNodeWithMeta[], path));
    }
  });
  return result;
}

