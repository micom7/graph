import { useEffect, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useGraphStore } from '../store/graphStore'
import { nodeTypes } from './nodes/NodeTypes'
import Toolbar from './panels/Toolbar'
import NodeEditor from './panels/NodeEditor'
import SavePanel from './panels/SavePanel'
import type { DeviceNodeData } from '../types/graph'

export default function GraphEditor() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const onNodesChange = useGraphStore((s) => s.onNodesChange)
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange)
  const onConnect = useGraphStore((s) => s.onConnect)
  const loadFromLocalStorage = useGraphStore((s) => s.loadFromLocalStorage)
  const autoSave = useGraphStore((s) => s.autoSave)
  const selectNode = useGraphStore((s) => s.selectNode)
  const deleteNode = useGraphStore((s) => s.deleteNode)

  // Load autosave on mount
  useEffect(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  // Click on empty canvas deselects node
  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Delete selected node or selected edges with Delete key
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useGraphStore.getState()
        if (state.selectedNodeId) {
          deleteNode(state.selectedNodeId)
          return
        }
        const selectedEdgeIds = state.edges
          .filter((edge) => edge.selected)
          .map((edge) => ({ type: 'remove' as const, id: edge.id }))
        if (selectedEdgeIds.length > 0) {
          onEdgesChange(selectedEdgeIds)
        }
      }
    },
    [deleteNode, onEdgesChange],
  )

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f0f1a' }} onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes as Node<DeviceNodeData>[]}
        edges={edges as Edge[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={autoSave}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
        connectionRadius={60}
        deleteKeyCode={null}    // we handle delete manually
        defaultEdgeOptions={{
          style: { stroke: '#64b5f6', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#64b5f6' },
        }}
        style={{ background: '#0f0f1a' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#2a2a4a"
        />
        <Controls
          style={{ background: '#16213e', border: '1px solid #333' }}
        />
        <MiniMap
          style={{ background: '#16213e', border: '1px solid #333' }}
          nodeColor={(n) => {
            const data = n.data as DeviceNodeData
            const dt = data?.deviceTypes?.find((t) => t.name === data?.type)
            return dt?.color ?? '#4A90D9'
          }}
          maskColor="#0f0f1a99"
        />
      </ReactFlow>

      <Toolbar />
      <NodeEditor />
      <SavePanel />
    </div>
  )
}
