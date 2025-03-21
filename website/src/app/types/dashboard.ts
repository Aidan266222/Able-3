export interface Achievement {
    id: number
    name: string
    description: string
    criteria: string
    icon: string
    completed: boolean
    completed_at?: string
  }
  
  export interface UserAchievement {
    id: string
    user_id: string
    achievement_id: number
    completed_at: string
  }
  
  export interface UserStreak {
    id: string
    user_id: string
    current_streak: number
    longest_streak: number
    last_activity_date: string
  }
  
  export interface SharedLesson {
    id: string
    lesson_id: string
    shared_by: string
    shared_with: string
    created_at: string
    lesson?: {
      id: string
      name: string
      description?: string
      image_url?: string
      user_id: string
      created_at: string
    }
  }
  
  export interface UserStats {
    totalLessonsCreated: number
    totalLessonsCompleted: number
    totalScore: number
    averageScore: number
    bestScore: number
    streak: {
      current: number
      longest: number
      lastActivityDate: string
    }
  }
  
  