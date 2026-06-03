'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Text, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import { useScenarioPlannerStore, type ScenarioPlannerNode } from '@/store/scenario-planner-store';
import { useTheme } from '@/hooks';
import {
  domovoyCanvas,
  domovoyRoomPlanner,
  scenarioNodeColor,
} from '@/lib/domovoy-canvas-palette';

const DEFAULT_CANVAS_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 1080;
const VIRTUAL_SIZE = 5000;

export function CanvasStage() {
  const { resolvedTheme } = useTheme();
  const stageRef = useRef<KonvaStage | null>(null);

  const nodes = useScenarioPlannerStore((s) => s.nodes);
  const edges = useScenarioPlannerStore((s) => s.edges);
  const selectedNodeId = useScenarioPlannerStore((s) => s.selectedNodeId);
  const selectNode = useScenarioPlannerStore((s) => s.selectNode);
  const updateNode = useScenarioPlannerStore((s) => s.updateNode);
  const addEdge = useScenarioPlannerStore((s) => s.addEdge);
  const pendingConnectFromId = useScenarioPlannerStore((s) => s.pendingConnectFromId);
  const setPendingConnectFromId = useScenarioPlannerStore((s) => s.setPendingConnectFromId);
  const addNode = useScenarioPlannerStore((s) => s.addNode);
  const pendingCatalogItem = useScenarioPlannerStore((s) => s.pendingCatalogItem);
  const setPendingCatalogItem = useScenarioPlannerStore((s) => s.setPendingCatalogItem);
  const mode = useScenarioPlannerStore((s) => s.mode);
  const zoom = useScenarioPlannerStore((s) => s.zoom);
  const graphRevision = useScenarioPlannerStore((s) => s.graphRevision);

  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  });

  const scale = zoom / 100;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!pendingCatalogItem) return;

      const rect = container.getBoundingClientRect();
      const xScreen = e.clientX - rect.left;
      const yScreen = e.clientY - rect.top;

      const xWorld = (xScreen - stage.x()) / scale;
      const yWorld = (yScreen - stage.y()) / scale;

      addNode({
        type: pendingCatalogItem.type,
        kind: pendingCatalogItem.kind,
        title: pendingCatalogItem.title,
        x: Math.max(0, Math.min(VIRTUAL_SIZE - 240, xWorld)),
        y: Math.max(0, Math.min(VIRTUAL_SIZE - 80, yWorld)),
        data: {},
      });

      setPendingCatalogItem(null);
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [addNode, pendingCatalogItem, scale, setPendingCatalogItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectNode]);

  const handleBackgroundClick = () => {
    selectNode(null);
  };

  const canConnect = useCallback((from: ScenarioPlannerNode, to: ScenarioPlannerNode) => {
    if (from.id === to.id) return false;
    if (from.type === 'end') return false;
    if (to.type === 'start') return false;

    if (from.type === 'start') return to.type === 'trigger' || to.type === 'condition';
    if (from.type === 'trigger') return to.type === 'condition' || to.type === 'action';
    if (from.type === 'condition') return to.type === 'action';
    if (from.type === 'action') return to.type === 'end';

    return false;
  }, []);

  const connections = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const midY = (a: { y: number }, b: { y: number }) => (a.y + b.y) / 2;
    return edges
      .map((e) => {
        const from = byId.get(e.from);
        const to = byId.get(e.to);
        if (!from || !to) return null;
        const fromX = from.x + 220;
        const fromY = from.y + 24;
        const toX = to.x;
        const toY = to.y + 24;
        const cx = (fromX + toX) / 2;
        return {
          id: e.id,
          points: [fromX, fromY, cx, midY(from, to) + 24, toX, toY],
        };
      })
      .filter((x): x is { id: string; points: number[] } => x !== null);
  }, [edges, nodes]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const margin = 60;
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + 220));
    const maxY = Math.max(...nodes.map((n) => n.y + 48));
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);

    const fitScale = Math.min(
      (stageSize.width - margin * 2) / bw,
      (stageSize.height - margin * 2) / bh,
      1
    );
    const nextScale = Math.max(0.5, Math.min(1, fitScale));

    const cx = minX + bw / 2;
    const cy = minY + bh / 2;
    const x = stageSize.width / 2 - cx * scale;
    const y = stageSize.height / 2 - cy * scale;

    setStagePos({ x, y });
  }, [graphRevision, nodes.length, scale, stageSize.height, stageSize.width]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();
    const parent = container?.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    });
    ro.observe(parent);
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) setStageSize({ width: rect.width, height: rect.height });
    return () => ro.disconnect();
  }, []);

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    if (mode !== 'pan') return;
    setStagePos({ x: e.target.x(), y: e.target.y() });
  };

  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const bg =
    theme === 'dark' ? domovoyRoomPlanner.canvasSurfaceDark : domovoyRoomPlanner.canvasSurfaceLight;
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(26, 35, 126, 0.08)';
  const edgeStroke =
    theme === 'dark' ? 'rgba(159, 168, 218, 0.38)' : 'rgba(26, 35, 126, 0.32)';

  const gridLines = useMemo(() => {
    const step = 80;
    const lines: number[][] = [];
    for (let x = 0; x <= VIRTUAL_SIZE; x += step) {
      lines.push([x, 0, x, VIRTUAL_SIZE]);
    }
    for (let y = 0; y <= VIRTUAL_SIZE; y += step) {
      lines.push([0, y, VIRTUAL_SIZE, y]);
    }
    return lines;
  }, []);

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={scale}
      scaleY={scale}
      draggable={mode === 'pan'}
      onDragMove={handleDragMove}
      onMouseDown={(e) => {
        const isStage = e.target === e.target.getStage();
        if (isStage) handleBackgroundClick();
      }}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={VIRTUAL_SIZE}
          height={VIRTUAL_SIZE}
          fill={bg}
          name="background"
          onClick={handleBackgroundClick}
        />

        {gridLines.map((pts, idx) => (
          <Line key={idx} points={pts} stroke={grid} strokeWidth={1} listening={false} />
        ))}

        {connections.map((c) => (
          <Line
            key={c.id}
            points={c.points}
            stroke={edgeStroke}
            strokeWidth={2}
            tension={0.25}
            bezier
            listening={false}
          />
        ))}

        {nodes.map((n) => {
          const isSelected = n.id === selectedNodeId;
          const fill = scenarioNodeColor(n.type, theme);
          const border =
            n.type === 'start' || n.type === 'end'
              ? theme === 'dark'
                ? 'rgba(232, 234, 246, 0.45)'
                : 'rgba(26, 35, 126, 0.35)'
              : isSelected
                ? theme === 'dark'
                  ? domovoyCanvas.secondaryLight
                  : domovoyCanvas.primary
                : 'rgba(0,0,0,0)';

          return (
            <Group
              key={n.id}
              x={n.x}
              y={n.y}
              draggable={mode === 'select'}
              onDragEnd={(e) => updateNode(n.id, { x: e.target.x(), y: e.target.y() })}
              onMouseDown={(e) => {
                e.cancelBubble = true;
                if (mode === 'connect') {
                  const fromId = pendingConnectFromId;
                  if (!fromId) {
                    setPendingConnectFromId(n.id);
                    selectNode(n.id);
                    return;
                  }
                  const from = nodes.find((x) => x.id === fromId);
                  const to = n;
                  if (from && canConnect(from, to)) {
                    addEdge(from.id, to.id);
                    setPendingConnectFromId(null);
                    selectNode(to.id);
                    return;
                  }
                  setPendingConnectFromId(to.id);
                  selectNode(to.id);
                  return;
                }

                selectNode(n.id);
              }}
            >
              <Rect
                width={220}
                height={48}
                cornerRadius={n.type === 'start' || n.type === 'end' ? 24 : 10}
                fill={fill}
                stroke={border}
                strokeWidth={2}
                opacity={1}
              />
              <Text
                x={12}
                y={14}
                width={196}
                text={n.title}
                fontSize={13}
                fill={domovoyCanvas.onAccent}
                fontStyle={isSelected ? 'bold' : 'normal'}
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}

