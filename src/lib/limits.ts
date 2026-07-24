export type UserStatus = 'free' | 'basic' | 'pro' | 'premium' | 'blocked'

export interface PlanLimits {
  projects: number
  chaptersPerProject: number
  charactersPerProject: number
  locationsPerProject: number
  timelineEventsPerProject: number
  kanbanCardsPerProject: number
}

export const PLAN_LIMITS: Record<UserStatus, PlanLimits> = {
  free: {
    projects: 2,
    chaptersPerProject: 10,
    charactersPerProject: 10,
    locationsPerProject: 5,
    timelineEventsPerProject: 10,
    kanbanCardsPerProject: 15,
  },
  basic: {
    projects: 5,
    chaptersPerProject: 30,
    charactersPerProject: 30,
    locationsPerProject: 20,
    timelineEventsPerProject: 50,
    kanbanCardsPerProject: 50,
  },
  pro: {
    projects: 20,
    chaptersPerProject: 100,
    charactersPerProject: 100,
    locationsPerProject: 50,
    timelineEventsPerProject: 9999,
    kanbanCardsPerProject: 9999,
  },
  premium: {
    projects: 20,
    chaptersPerProject: 100,
    charactersPerProject: 100,
    locationsPerProject: 50,
    timelineEventsPerProject: 9999,
    kanbanCardsPerProject: 9999,
  },
  blocked: {
    projects: 0,
    chaptersPerProject: 0,
    charactersPerProject: 0,
    locationsPerProject: 0,
    timelineEventsPerProject: 0,
    kanbanCardsPerProject: 0,
  },
}

export const PLAN_NAMES: Record<UserStatus, string> = {
  free: 'Darmowym',
  basic: 'Podstawowym',
  pro: 'Pro',
  premium: 'Premium',
  blocked: 'Zablokowanym',
}

export function getLimitsForStatus(status: UserStatus | undefined | null): PlanLimits {
  if (!status || !PLAN_LIMITS[status]) return PLAN_LIMITS.free
  return PLAN_LIMITS[status]
}

export function isLimitReached(
  status: UserStatus | undefined | null,
  resource: keyof PlanLimits,
  currentCount: number
): { reached: boolean; limit: number; message?: string } {
  const currentStatus = status || 'free'
  if (currentStatus === 'blocked') {
    return {
      reached: true,
      limit: 0,
      message: 'Twoje konto jest zablokowane. Skontaktuj się z administratorem.',
    }
  }

  const limits = getLimitsForStatus(currentStatus)
  const limit = limits[resource]

  if (currentCount >= limit) {
    const planName = PLAN_NAMES[currentStatus] || 'Darmowym'
    return {
      reached: true,
      limit,
      message: `Osiągnięto limit w planie ${planName} (${currentCount}/${limit}). Przejdź na wyższy plan, aby dodać więcej!`,
    }
  }

  return { reached: false, limit }
}
