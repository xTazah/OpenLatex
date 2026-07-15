import { create } from "zustand";
import type { FsNode } from "@/lib/fs/fs-client";
import { listFiles } from "@/lib/fs/fs-client";
import type { FsEvent } from "@/lib/fs/fs-watcher-client";

interface FsState {
  root: string | null;
  tree: FsNode[];
  loading: boolean;
  error: string | null;

  loadTree: () => Promise<void>;
  applyEvent: (event: FsEvent) => void;
}

/** Walk the tree and collect every file path for flat lookups. */
export function flattenFiles(tree: FsNode[]): string[] {
  const out: string[] = [];
  const stack = [...tree];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    if (node.type === "file") out.push(node.path);
    else if (node.children) stack.push(...node.children);
  }
  return out;
}

function sortNodes(nodes: FsNode[]): FsNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
}

function addNodeToTree(tree: FsNode[], newNode: FsNode): FsNode[] {
  const segments = newNode.path.split("/");
  if (segments.length === 1) {
    if (tree.some((n) => n.path === newNode.path)) return tree;
    return sortNodes([...tree, newNode]);
  }

  const parentPath = segments.slice(0, -1).join("/");
  return insertUnderParent(tree, parentPath, newNode);
}

/** Find the dir node at `parentPath` (however deep) and append `newNode` to its children. */
function insertUnderParent(
  tree: FsNode[],
  parentPath: string,
  newNode: FsNode,
): FsNode[] {
  return tree.map((node) => {
    if (node.path === parentPath && node.type === "dir") {
      const children = node.children ?? [];
      if (children.some((c) => c.path === newNode.path)) return node;
      return { ...node, children: sortNodes([...children, newNode]) };
    }
    if (node.type === "dir" && parentPath.startsWith(`${node.path}/`)) {
      return {
        ...node,
        children: insertUnderParent(node.children ?? [], parentPath, newNode),
      };
    }
    return node;
  });
}

function removeFromTree(tree: FsNode[], targetPath: string): FsNode[] {
  const result: FsNode[] = [];
  for (const node of tree) {
    if (node.path === targetPath) continue;
    if (node.type === "dir" && targetPath.startsWith(`${node.path}/`)) {
      const children = removeFromTree(node.children ?? [], targetPath);
      result.push({ ...node, children });
    } else {
      result.push(node);
    }
  }
  return result;
}

export const useFsStore = create<FsState>((set) => ({
  root: null,
  tree: [],
  loading: false,
  error: null,

  async loadTree() {
    set({ loading: true, error: null });
    try {
      const { root, tree } = await listFiles();
      set({ root, tree, loading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to list files";
      set({ error: message, loading: false });
    }
  },

  applyEvent(event) {
    set((state) => {
      if (event.type === "unlink" || event.type === "unlinkDir") {
        return { tree: removeFromTree(state.tree, event.path) };
      }

      if (event.type === "add" || event.type === "addDir") {
        const isDir = event.type === "addDir";
        const newNode: FsNode = {
          path: event.path,
          type: isDir ? "dir" : "file",
          mtime: Date.now(),
          ...(isDir ? { children: [] } : {}),
        };
        return { tree: addNodeToTree(state.tree, newNode) };
      }

      // change — just bump mtime
      return {
        tree: bumpMtime(state.tree, event.path),
      };
    });
  },
}));

function bumpMtime(tree: FsNode[], targetPath: string): FsNode[] {
  return tree.map((node) => {
    if (node.path === targetPath) return { ...node, mtime: Date.now() };
    if (node.type === "dir" && targetPath.startsWith(`${node.path}/`)) {
      return { ...node, children: bumpMtime(node.children ?? [], targetPath) };
    }
    return node;
  });
}
