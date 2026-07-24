import { useRef, useCallback, useState } from 'react'
import ReactFlow, {
  Background, Controls,
  useNodesState, useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  Handle, Position,
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

function CharacterNode({ data }: { data: any }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `2px solid ${data.isMain ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 10,
      padding: '10px 14px',
      color: 'var(--text-primary)',
      minWidth: 140,
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Top} id="top-target" style={{ background: 'var(--accent)', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Top} id="top-source" style={{ background: 'var(--accent)', width: 10, height: 10 }} />
      
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: 'var(--accent)', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: 'var(--accent)', width: 10, height: 10 }} />

      <Handle type="target" position={Position.Left} id="left-target" style={{ background: 'var(--accent)', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'var(--accent)', width: 10, height: 10 }} />

      <Handle type="target" position={Position.Right} id="right-target" style={{ background: 'var(--accent)', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'var(--accent)', width: 10, height: 10 }} />

      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{data.name}</div>
      {data.nickname && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>„{data.nickname}”</div>}
      {data.faction && <div style={{ fontSize: 9.5, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>{data.faction}</div>}
    </div>
  )
}

function buildGraph(characters: Character[], relations: CharacterRelation[]) {
  const nodes: Node[] = characters.map((c, i) => ({
    id: c.id,
    type: 'characterNode',
    data: {
      name: c.name,
      nickname: c.nickname,
      faction: c.faction,
      isMain: c.role === 'main',
    },
    position: {
      x: (i % 3) * 280 + 40,
      y: Math.floor(i / 3) * 190 + 40,
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

const nodeTypes = {
  characterNode: CharacterNode,
}
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
