import { createClient } from "@supabase/supabase-js"
import type { Achievement, UserStats } from "../types/dashboard"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Define all possible achievements
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    name: "First Lesson",
    description: "Create your first lesson",
    criteria: "lessons_created >= 1",
    icon: "BookOpen",
    completed: false,
  },
  {
    id: 2,
    name: "Perfect Score",
    description: "Get 100% on a lesson",
    criteria: "has_perfect_score",
    icon: "Star",
    completed: false,
  },
  {
    id: 3,
    name: "Streak Master",
    description: "Maintain a 3-day streak",
    criteria: "streak >= 3",
    icon: "Flame",
    completed: false,
  },
  {
    id: 4,
    name: "Content Creator",
    description: "Create 5 lessons",
    criteria: "lessons_created >= 5",
    icon: "PlusCircle",
    completed: false,
  },
  {
    id: 5,
    name: "Quiz Champion",
    description: "Complete 10 lessons",
    criteria: "lessons_completed >= 10",
    icon: "Trophy",
    completed: false,
  },
  {
    id: 6,
    name: "Sharing is Caring",
    description: "Share a lesson with someone",
    criteria: "has_shared_lesson",
    icon: "Share2",
    completed: false,
  },
  {
    id: 7,
    name: "Social Learner",
    description: "Add a shared lesson to your collection",
    criteria: "has_added_shared_lesson",
    icon: "Users",
    completed: false,
  },
  {
    id: 8,
    name: "Dedicated Learner",
    description: "Maintain a 7-day streak",
    criteria: "streak >= 7",
    icon: "Zap",
    completed: false,
  },
]

// Check if user has earned any new achievements
export async function checkAchievements(userId: string, stats: UserStats): Promise<Achievement[]> {
  try {
    // Get user's current achievements
    const { data: userAchievements, error } = await supabase
      .from("user_achievements")
      .select("achievement_id, completed_at")
      .eq("user_id", userId)

    if (error) throw error

    // Create a map of completed achievements
    const completedMap = new Map(userAchievements?.map((ua) => [ua.achievement_id, ua.completed_at]) || [])

    // Check for additional achievement criteria
    const { data: hasSharedLesson } = await supabase
      .from("shared_lessons")
      .select("id")
      .eq("shared_by", userId)
      .limit(1)

    const { data: hasAddedSharedLesson } = await supabase
      .from("shared_lessons")
      .select("id")
      .eq("shared_with", userId)
      .limit(1)

    const { data: perfectScores } = await supabase
      .from("participants")
      .select("id, score, session:live_sessions(lesson:lessons(questions))")
      .eq("user_id", userId)

    // Check if any session has a perfect score
    const hasPerfectScore = perfectScores?.some((p) => {
      const questions = p.session?.[0]?.lesson?.[0]?.questions || []
      const maxPossibleScore = questions.length * 100 // Simplified calculation
      return p.score >= maxPossibleScore
    })

    // Evaluate each achievement
    const achievements = ACHIEVEMENTS.map((achievement) => {
      const isCompleted = completedMap.has(achievement.id)
      const completedAt = completedMap.get(achievement.id)

      // Check if achievement should be completed based on criteria
      let shouldComplete = false

      switch (achievement.criteria) {
        case "lessons_created >= 1":
          shouldComplete = stats.totalLessonsCreated >= 1
          break
        case "lessons_created >= 5":
          shouldComplete = stats.totalLessonsCreated >= 5
          break
        case "lessons_completed >= 10":
          shouldComplete = stats.totalLessonsCompleted >= 10
          break
        case "streak >= 3":
          shouldComplete = stats.streak.current >= 3
          break
        case "streak >= 7":
          shouldComplete = stats.streak.current >= 7
          break
        case "has_perfect_score":
          shouldComplete = !!hasPerfectScore
          break
        case "has_shared_lesson":
          shouldComplete = hasSharedLesson && hasSharedLesson.length > 0
          break
        case "has_added_shared_lesson":
          shouldComplete = hasAddedSharedLesson && hasAddedSharedLesson.length > 0
          break
      }

      // If achievement should be completed but isn't yet, add it to the database
      if (shouldComplete && !isCompleted) {
        addAchievement(userId, achievement.id)
      }

      return {
        ...achievement,
        completed: isCompleted || shouldComplete,
        completed_at: completedAt,
      }
    })

    return achievements
  } catch (error) {
    console.error("Error checking achievements:", error)
    return ACHIEVEMENTS
  }
}

// Add a new achievement for a user
async function addAchievement(userId: string, achievementId: number) {
  try {
    await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
      completed_at: new Date().toISOString(),
    })

    // In a real app, you might want to show a notification or animation
    console.log(`Achievement unlocked: ${achievementId}`)
  } catch (error) {
    console.error("Error adding achievement:", error)
  }
}

// Update user streak
export async function updateStreak(userId: string): Promise<{
  current: number
  longest: number
  lastActivityDate: string
}> {
  try {
    // Get user's current streak
    const { data: streakData, error } = await supabase.from("user_streaks").select("*").eq("user_id", userId).single()

    const now = new Date()
    const today = now.toISOString().split("T")[0]

    if (error) {
      // User doesn't have a streak record yet, create one
      const { data: newStreak, error: insertError } = await supabase
        .from("user_streaks")
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return {
        current: 1,
        longest: 1,
        lastActivityDate: today,
      }
    }

    // User has a streak record, update it
    const lastActivityDate = new Date(streakData.last_activity_date)
    const lastActivityDay = lastActivityDate.toISOString().split("T")[0]

    // If already logged in today, don't update streak
    if (lastActivityDay === today) {
      return {
        current: streakData.current_streak,
        longest: streakData.longest_streak,
        lastActivityDate: streakData.last_activity_date,
      }
    }

    // Calculate days between last activity and today
    const timeDiff = now.getTime() - lastActivityDate.getTime()
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24))

    let currentStreak = streakData.current_streak
    let longestStreak = streakData.longest_streak

    // If last activity was yesterday, increment streak
    if (daysDiff === 1) {
      currentStreak += 1
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
      }
    }
    // If more than 1 day has passed, reset streak
    else if (daysDiff > 1) {
      currentStreak = 1
    }

    // Update streak in database
    await supabase
      .from("user_streaks")
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
      })
      .eq("user_id", userId)

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActivityDate: today,
    }
  } catch (error) {
    console.error("Error updating streak:", error)
    return {
      current: 0,
      longest: 0,
      lastActivityDate: new Date().toISOString(),
    }
  }
}

