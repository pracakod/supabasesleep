export interface Profile {
  id: string
  email: string | null
  display_name: string
  pseudonym: string
  avatar_url: string | null
  status: 'free' | 'premium' | 'blocked'
  total_words: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  owner_id: string
  title: string
  subtitle: string
  genre: string
  description: string
  cover_url: string | null
  target_words: number
  total_words: number
  visibility: 'private' | 'readonly' | 'collaborative'
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  project_id: string
  title: string
  content: string
  word_count: number
  position: number
  act: string
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  project_id: string
  name: string
  nickname: string
  role: 'main' | 'secondary' | 'minor'
  birth_year: number | null
  faction: string
  appearance: string
  psychology: string
  motivations: string
  secrets: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface CharacterRelation {
  id: string
  project_id: string
  from_character_id: string
  to_character_id: string
  relation_type: string
  description: string
  created_at: string
}

export interface Location {
  id: string
  project_id: string
  name: string
  location_type: string
  description: string
  story_significance: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  project_id: string
  title: string
  description: string
  reader_order: number
  world_year: number
  timeline_type: 'present' | 'flashback' | 'time_travel' | 'alternate'
  plotline: string
  plotline_color: string
  character_ids: string[]
  location_id: string | null
  created_at: string
  updated_at: string
}

export interface KanbanCard {
  id: string
  project_id: string
  chapter_id: string | null
  title: string
  description: string
  color: string
  position: number
  created_at: string
  updated_at: string
}

export interface GlossaryTerm {
  id: string
  project_id: string
  name: string
  category: string
  definition: string
  related_character_ids: string[]
  created_at: string
  updated_at: string
}

export interface ResearchLink {
  id: string
  project_id: string
  title: string
  url: string
  description: string
  image_url: string | null
  created_at: string
}

export interface CustomTag {
  id: string
  project_id: string
  tag_type: 'faction' | 'location_type' | 'glossary_category' | 'plotline'
  value: string
  color: string
  created_at: string
}

export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  role: 'reader' | 'editor'
  created_at: string
}

export interface UserCustomGenre {
  id: string
  user_id: string
  name: string
  min_words: number
  max_words: number
  description: string
  created_at: string
  updated_at: string
}
