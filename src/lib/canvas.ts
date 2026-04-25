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
