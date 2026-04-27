export const COURSE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#14b8a6', '#a855f7',
  '#ef4444', '#3b82f6',
]

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
}

export interface CanvasAssignment {
  id: number
  name: string
  due_at: string | null
  course_id: number
  points_possible: number
  submission?: {
    submitted_at: string | null
    workflow_state: string
  }
}

export async function fetchCanvasCourses(url: string, token: string): Promise<CanvasCourse[]> {
  const data = await window.electronAPI!.canvasFetchAll(
    url, token, 'courses?enrollment_state=active&per_page=100'
  )
  return data as CanvasCourse[]
}

export async function fetchCourseAssignments(url: string, token: string, courseId: number): Promise<CanvasAssignment[]> {
  const data = await window.electronAPI!.canvasFetchAll(
    url, token,
    `courses/${courseId}/assignments?per_page=100&include[]=submission&order_by=due_at`
  )
  return data as CanvasAssignment[]
}
