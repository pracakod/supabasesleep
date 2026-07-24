import { useRef, useCallback, useState } from 'react'
import ReactFlow, {
  Background, Controls,
  useNodesState, useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
} from 'reactflow'
import type { Node, Edge, Connection } from 'reactflow'
import 'reactflow/dist/style.css'
import type { Character, CharacterRelation } from '../../types/database.types'

interface Props {
  characters: Character[]
  relations: CharacterRelation[]
  onAddCharacterAtPosition?: (x: number, y: number, sourceId?: string) => void
  onAddRelation?: (fromId: string, toId: string, type: string) => void
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

function CharacterTreeInner({ characters, relations, onAddCharacterAtPosition, onAddRelation }: Props) {
  const { project } = useReactFlow()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const connectingNodeId = useRef<string | null>(null)

  const [connectModal, setConnectModal] = useState<{ sourceId: string; targetId: string } | null>(null)
  const [relationTypeInput, setRelationTypeInput] = useState('Przyjaciel')

  const { nodes: initNodes, edges: initEdges } = buildGraph(characters, relations)
  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target && connection.source !== connection.target) {
      setConnectModal({ sourceId: connection.source, targetId: connection.target })
    }
  }, [])

  const handleConfirmRelation = () => {
    if (connectModal && onAddRelation) {
      onAddRelation(connectModal.sourceId, connectModal.targetId, relationTypeInput)
      setEdges((eds) => addEdge({
        id: `${connectModal.sourceId}-${connectModal.targetId}`,
        source: connectModal.sourceId,
        target: connectModal.targetId,
        label: relationTypeInput,
        type: 'smoothstep',
        style: { stroke: 'var(--accent)', strokeWidth: 2 },
      }, eds))
    }
    setConnectModal(null)
  }

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

  const sourceChar = characters.find(c => c.id === connectModal?.sourceId)
  const targetChar = characters.find(c => c.id === connectModal?.targetId)

  return (
    <div ref={reactFlowWrapper} style={{ height: 600, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
      </ReactFlow>

      {/* Modal definiowania relacji połączeniem */}
      {connectModal && (
        <div className="modal-backdrop" onClick={() => setConnectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              Dodaj relację między postaciami
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Połącz <strong>{sourceChar?.name || 'Postać A'}</strong> z <strong>{targetChar?.name || 'Postać B'}</strong>
            </p>
            <div className="form-group">
              <label className="label">Typ relacji / Powiązanie</label>
              <input
                type="text"
                className="input"
                placeholder="np. Przyjaciel, Wróg, Brat, Sojusznik..."
                value={relationTypeInput}
                onChange={e => setRelationTypeInput(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setConnectModal(null)}>Anuluj</button>
              <button className="btn btn-primary" onClick={handleConfirmRelation}>Połącz postacie</button>
            </div>
          </div>
        </div>
      )}
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
