import { CanvasCourseSettings, CanvasSettings, Reminder } from './types'
import { storage } from './storage'
import { generateId } from './utils'
import { fetchCanvasCourses, fetchCourseAssignments, COURSE_COLORS } from './canvas'

function nextColor(alreadyUsed: CanvasCourseSettings[]): string {
  const used = new Set(alreadyUsed.map((s) => s.color))
  return COURSE_COLORS.find((c) => !used.has(c)) ?? COURSE_COLORS[alreadyUsed.length % COURSE_COLORS.length]
}

export async function performCanvasSync(
  settings: CanvasSettings,
  existingCourseSettings: CanvasCourseSettings[]
): Promise<{ reminders: Reminder[]; courseSettings: CanvasCourseSettings[] }> {
  const { url, token } = settings
  const now = new Date().toISOString()

  // Only include assignments due within the last 2 months or in the future
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 2)
  const cutoffStr = cutoff.toISOString()

  const courses = await fetchCanvasCourses(url, token)

  // Merge with existing settings: keep user's tracked/color choices, add new courses
  const existingById = new Map(existingCourseSettings.map((s) => [s.id, s]))
  const courseSettings: CanvasCourseSettings[] = []
  for (const course of courses) {
    const existing = existingById.get(course.id)
    courseSettings.push(
      existing
        ? { ...existing, name: course.name }
        : { id: course.id, name: course.name, color: nextColor(courseSettings), tracked: true }
    )
  }

  // Fetch assignments only for tracked courses
  const trackedSettings = courseSettings.filter((s) => s.tracked)
  const courseAssignments = await Promise.all(
    trackedSettings.map(async (cs) => {
      try {
        const assignments = await fetchCourseAssignments(url, token, cs.id)
        return { cs, assignments }
      } catch {
        return { cs, assignments: [] }
      }
    })
  )

  // Index existing canvas reminders for update vs create
  const existingReminders = storage.getReminders()
  const byAssignmentId = new Map<string, Reminder>()
  for (const r of existingReminders) {
    if (r.source === 'canvas' && r.canvasAssignmentId) {
      byAssignmentId.set(r.canvasAssignmentId, r)
    }
  }

  const canvasReminders: Reminder[] = []

  for (const { cs, assignments } of courseAssignments) {
    for (const a of assignments) {
      // Skip assignments older than 2 months
      if (a.due_at && a.due_at < cutoffStr) continue

      const aid = a.id.toString()
      const dueDate = a.due_at ?? undefined
      const submitted = ['submitted', 'graded'].includes(a.submission?.workflow_state ?? '')
      const found = byAssignmentId.get(aid)

      if (found) {
        canvasReminders.push({
          ...found,
          title: a.name,
          dueDate,
          color: cs.color,
          canvasCourseId: cs.id,
          notes: !found.notes || found.notes === cs.name ? cs.name : found.notes,
          completed: submitted || found.completed,
          updatedAt: now,
        })
      } else {
        canvasReminders.push({
          id: generateId(),
          title: a.name,
          notes: cs.name,
          dueDate,
          completed: submitted,
          priority: 'high',
          source: 'canvas',
          color: cs.color,
          canvasAssignmentId: aid,
          canvasCourseId: cs.id,
          createdAt: now,
          updatedAt: now,
        })
      }
    }
  }

  const personalReminders = existingReminders.filter((r) => r.source !== 'canvas')
  const merged = [...personalReminders, ...canvasReminders]
  storage.setReminders(merged)

  return { reminders: merged, courseSettings }
}
