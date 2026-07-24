import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import type { ModuleId } from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import Dashboard from '../modules/dashboard/Dashboard'
import Editor from '../modules/editor/Editor'
import Characters from '../modules/characters/Characters'
import Locations from '../modules/locations/Locations'
import Timeline from '../modules/timeline/Timeline'
import Kanban from '../modules/kanban/Kanban'
import Research from '../modules/research/Research'
import WriterZone from '../modules/writer-zone/WriterZone'
import ProfilePage from './ProfilePage'
import { useProject } from '../contexts/ProjectContext'
import { useRealtimeCollab } from '../hooks/useRealtimeCollab'

export default function AppLayout() {
  const [activeModule, setActiveModule] = useState<ModuleId>(() => {
    const saved = localStorage.getItem('active_module') as ModuleId
    return saved || 'dashboard'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentProject } = useProject()

  const handleModuleChange = (id: ModuleId) => {
    setActiveModule(id)
    localStorage.setItem('active_module', id)
  }

  const { participants } = useRealtimeCollab(
    currentProject?.id ?? null,
    currentProject?.visibility,
    activeModule,
  )

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':   return <Dashboard />
      case 'editor':      return <Editor />
      case 'characters':  return <Characters />
      case 'locations':   return <Locations />
      case 'timeline':    return <Timeline />
      case 'kanban':      return <Kanban />
      case 'research':    return <Research />
      case 'writer-zone': return <WriterZone />
      case 'profile':     return <ProfilePage />
      default:            return <Dashboard />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        active={activeModule}
        onChange={handleModuleChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          participants={participants}
          activeModule={activeModule}
        />
        <div style={{ flex: 1, position: 'relative', minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
          {renderModule()}
        </div>
      </div>
    </div>
  )
}
