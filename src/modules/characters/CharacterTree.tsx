import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import { useRef, useCallback } from 'react'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import type { Character, CharacterRelation } from '../../types/database.types'

interface Props {
  characters: Character[]
  relations: CharacterRelation[]
  onAddCharacterAtPosition?: (x: number, y: number, sourceId?: string) => void
}

function buildGraph(characters: Character[], relations: CharacterRelation[]) {
  const nodes: Node[] = characters.map((c, i) => ({
    id: c.id,
    type: 'default',
    data: {
      label: (
        <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{c.name}</div>
          {c.nickname && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>„{c.nickname}"</div>}
          {c.faction && <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 2 }}>{c.faction}</div>}
        </div>
      ),
    },
    position: {
      x: (i % 3) * 260 + 40,
      y: Math.floor(i / 3) * 180 + 40,
    },
    style: {
      background: 'var(--bg-card)',
      border: `2px solid ${c.role === 'main' ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 10,
      padding: '10px 14px',
      color: 'var(--text-primary)',
      minWidth: 130,
    },
  }))

  const seen = new Set<string>()
  const edges: Edge[] = []
  relations.forEach(rel => {
    const key = [rel.from_character_id, rel.to_character_id].sort().join('-')
    if (!seen.has(key)) {
      seen.add(key)
      edges.push({
        id: rel.id,
        source: rel.from_character_id,
        target: rel.to_character_id,
        label: rel.relation_type,
        labelStyle: { fontSize: 10, fill: 'var(--text-primary)', fontWeight: 600 },
        labelBgStyle: { fill: 'var(--bg-card)', stroke: 'var(--border)', strokeWidth: 1, rx: 4, ry: 4 },
        labelBgPadding: [6, 4],
        style: { stroke: 'var(--accent)', strokeWidth: 2 },
        type: 'smoothstep',
      })
    }
  })

  return { nodes, edges }
}

const nodeTypes = {}
const edgeTypes = {}

function CharacterTreeInner({ characters, relations, onAddCharacterAtPosition }: Props) {
  const { project } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const connectingNodeId = useRef<string | null>(null)

  const { nodes: initNodes, edges: initEdges } = buildGraph(characters, relations)
  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    connectingNodeId.current = nodeId
  }, [])

  const onConnectEnd = useCallback((event: any) => {
    const targetIsNode = event.target.closest('.react-flow__node')

    if (!targetIsNode && connectingNodeId.current && onAddCharacterAtPosition) {
      const { top, left } = reactFlowWrapper.current!.getBoundingClientRect()
      const projectedPosition = project({
        x: event.clientX - left,
        y: event.clientY - top,
      })

      onAddCharacterAtPosition(projectedPosition.x, projectedPosition.y, connectingNodeId.current)
    }
  }, [project, onAddCharacterAtPosition])

  const onPaneDoubleClick = useCallback((event: any) => {
    const targetIsNode = event.target.closest('.react-flow__node')
    if (!targetIsNode && onAddCharacterAtPosition) {
      const { top, left } = reactFlowWrapper.current!.getBoundingClientRect()
      const projectedPosition = project({
        x: event.clientX - left,
        y: event.clientY - top,
      })
      onAddCharacterAtPosition(projectedPosition.x, projectedPosition.y)
    }
  }, [project, onAddCharacterAtPosition])

  if (characters.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <p>Brak postaci do wyświetlenia w drzewie.</p>
    </div>
  )

  return (
    <div ref={reactFlowWrapper} style={{ height: 600, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneDoubleClick}
        fitView
        minZoom={0.3}
        maxZoom={1.8}
        translateExtent={[[-1000, -1000], [2000, 2000]]}
        nodeExtent={[[-800, -800], [1800, 1800]]}
        attributionPosition="bottom-left"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
        <MiniMap style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          nodeColor="var(--accent)" maskColor="rgba(0,0,0,0.3)" />
      </ReactFlow>
    </div>
  )
}

export default function CharacterTree(props: Props) {
  return (
    <ReactFlowProvider>
      <CharacterTreeInner {...props} />
    </ReactFlowProvider>
  )
}
