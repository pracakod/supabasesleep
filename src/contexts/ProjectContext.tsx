import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Project } from '../types/database.types'
import { useAuth } from './AuthContext'

interface ProjectContextType {
  currentProject: Project | null
  setCurrentProject: (p: Project | null) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentProject, setCurrentProject] = useState<Project | null>(() => {
    const saved = localStorage.getItem('sk-current-project')
    return saved ? JSON.parse(saved) : null
  })

  // Synchronize project with logged-in user
  useEffect(() => {
    if (!user) {
      setCurrentProject(null)
      localStorage.removeItem('sk-current-project')
    } else if (currentProject && currentProject.owner_id !== user.id) {
      setCurrentProject(null)
      localStorage.removeItem('sk-current-project')
    }
  }, [user])

  const setProject = (p: Project | null) => {
    setCurrentProject(p)
    if (p) localStorage.setItem('sk-current-project', JSON.stringify(p))
    else localStorage.removeItem('sk-current-project')
  }

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject: setProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
