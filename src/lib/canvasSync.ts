import { CanvasSettings, Reminder } from './types'
import { storage } from './storage'
import { generateId } from './utils'
import { fetchCanvasCourses, fetchCourseAssignments } from './canvas'

export async function performCanvasSync(settings: CanvasSettings): Promise<Reminder[]> {
  const { url, token } = settings
  const now = new Date().toISOString()

  const courses = await fetchCanvasCourses(url, token)

  const courseAssignments = await Promise.all(
    courses.map(async (course) => {
      try {
        const assignments = await fetchCourseAssignments(url, token, course.id)
        return { course, assignments }
      } catch {
        return { course, assignments: [] }
      }
    })
  )

  const existing = storage.getReminders()

  // Index existing canvas reminders by canvasAssignmentId for fast lookup
  const byAssignmentId = new Map<string, Reminder>()
  for (const r of existing) {
    if (r.source === 'canvas' && r.canvasAssignmentId) {
      byAssignmentId.set(r.canvasAssignmentId, r)
    }
  }

  const canvasReminders: Reminder[] = []

  for (const { course, assignments } of courseAssignments) {
    for (const a of assignments) {
      const aid = a.id.toString()
      const dueDate = a.due_at ?? undefined
      const submitted = ['submitted', 'graded'].includes(a.submission?.workflow_state ?? '')

      const found = byAssignmentId.get(aid)
      if (found) {
        canvasReminders.push({
          ...found,
          title: a.name,
          dueDate,
          // Preserve user-edited notes; only auto-set if notes still equals course name or is empty
          notes: found.notes === undefined || found.notes === course.name ? course.name : found.notes,
          completed: submitted || found.completed,
          updatedAt: now,
        })
      } else {
        canvasReminders.push({
          id: generateId(),
          title: a.name,
          notes: course.name,
          dueDate,
          completed: submitted,
          priority: 'medium',
          source: 'canvas',
          canvasAssignmentId: aid,
          createdAt: now,
          updatedAt: now,
        })
      }
    }
  }

  // Keep personal reminders, replace all canvas ones with fresh sync
  const personalReminders = existing.filter((r) => r.source !== 'canvas')
  const merged = [...personalReminders, ...canvasReminders]
  storage.setReminders(merged)
  return merged
}
