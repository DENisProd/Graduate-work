import { create } from 'zustand';

export type ScenarioPlannerNodeType = 'start' | 'end' | 'trigger' | 'condition' | 'action';
export type ScenarioPlannerNodeKind =
  | 'START'
  | 'END'
  | 'SCHEDULE'
  | 'MANUAL'
  | 'DEVICE_EVENT'
  | 'WEBHOOK'
  | 'ALWAYS'
  | 'DEVICE_STATE'
  | 'TIME_WINDOW'
  | 'DEVICE_COMMAND'
  | 'DELAY'
  | 'NOTIFY'
  | 'HTTP_REQUEST';

export type ScenarioPlannerNode = {
  id: string;
  type: ScenarioPlannerNodeType;
  kind: ScenarioPlannerNodeKind;
  title: string;
  x: number;
  y: number;
  data: Record<string, unknown>;
};

export type ScenarioPlannerEdge = {
  id: string;
  from: string;
  to: string;
};

export type ScenarioPlannerCatalogItem = {
  type: ScenarioPlannerNodeType;
  kind: ScenarioPlannerNodeKind;
  title: string;
};

type ScenarioPlannerMode = 'select' | 'pan' | 'connect';

type ScenarioPlannerState = {
  houseId: string | null;
  mode: ScenarioPlannerMode;
  zoom: number;
  nodes: ScenarioPlannerNode[];
  edges: ScenarioPlannerEdge[];
  selectedNodeId: string | null;
  pendingConnectFromId: string | null;
  pendingCatalogItem: ScenarioPlannerCatalogItem | null;

  initialize: (houseId: string) => void;
  setMode: (mode: ScenarioPlannerMode) => void;
  setZoom: (zoom: number) => void;
  addNode: (node: Omit<ScenarioPlannerNode, 'id'>) => void;
  updateNode: (id: string, patch: Partial<Pick<ScenarioPlannerNode, 'title' | 'x' | 'y' | 'data'>>) => void;
  removeNode: (id: string) => void;
  addEdge: (from: string, to: string) => void;
  removeEdge: (edgeId: string) => void;
  selectNode: (id: string | null) => void;
  setPendingCatalogItem: (item: ScenarioPlannerCatalogItem | null) => void;
  setGraph: (houseId: string, graph: { nodes: ScenarioPlannerNode[]; edges: ScenarioPlannerEdge[] }) => void;
  bumpGraphRevision: () => void;
  graphRevision: number;
  setPendingConnectFromId: (id: string | null) => void;
  reset: () => void;
};

const genId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `node_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

const startEndNodes = (houseId: string): ScenarioPlannerNode[] => [
  {
    id: `start_${houseId}`,
    type: 'start',
    kind: 'START',
    title: 'Начало',
    x: 120,
    y: 120,
    data: {},
  },
  {
    id: `end_${houseId}`,
    type: 'end',
    kind: 'END',
    title: 'Конец',
    x: 1520,
    y: 120,
    data: {},
  },
];

export const useScenarioPlannerStore = create<ScenarioPlannerState>((set, get) => ({
  houseId: null,
  mode: 'select',
  zoom: 100,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  pendingConnectFromId: null,
  pendingCatalogItem: null,
  graphRevision: 0,

  initialize: (houseId: string) => {
    const state = get();
    if (state.houseId === houseId && state.nodes.length > 0) {
      return;
    }
    set({
      houseId,
      nodes: startEndNodes(houseId),
      edges: [],
      selectedNodeId: null,
      pendingConnectFromId: null,
      pendingCatalogItem: null,
      mode: 'select',
      zoom: 100,
      graphRevision: state.graphRevision + 1,
    });
  },

  setMode: (mode) =>
    set((s) => ({
      mode,
      pendingConnectFromId: mode === 'connect' ? s.pendingConnectFromId : null,
    })),
  setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),

  addNode: (node) => {
    set((s) => ({
      nodes: [...s.nodes, { ...node, id: genId() }],
    }));
  },

  updateNode: (id, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch, data: { ...n.data, ...patch.data } } : n)),
    }));
  },

  removeNode: (id) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === id);
    if (node?.type === 'start' || node?.type === 'end') return;
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.from !== id && e.to !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }));
  },

  addEdge: (from, to) => {
    if (from === to) return;
    set((s) => {
      const exists = s.edges.some((e) => e.from === from && e.to === to);
      if (exists) return s;
      return { edges: [...s.edges, { id: genId(), from, to }] };
    });
  },

  removeEdge: (edgeId) => {
    set((s) => ({ edges: s.edges.filter((e) => e.id !== edgeId) }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setPendingCatalogItem: (item) => set({ pendingCatalogItem: item }),
  setGraph: (houseId, graph) => {
    const s = get();
    set({
      houseId,
      nodes: graph.nodes,
      edges: graph.edges,
      selectedNodeId: null,
      pendingConnectFromId: null,
      pendingCatalogItem: null,
      graphRevision: s.graphRevision + 1,
    });
  },
  bumpGraphRevision: () => set((s) => ({ graphRevision: s.graphRevision + 1 })),
  setPendingConnectFromId: (id) => set({ pendingConnectFromId: id }),

  reset: () => {
    const { houseId } = get();
    set({
      nodes: houseId ? startEndNodes(houseId) : [],
      edges: [],
      selectedNodeId: null,
      pendingConnectFromId: null,
      pendingCatalogItem: null,
      mode: 'select',
      zoom: 100,
      houseId,
      graphRevision: get().graphRevision + 1,
    });
  },
}));

