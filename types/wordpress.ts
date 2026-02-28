export interface WpCreateCoursePayload {
  title: string;
  content: string;
  status?: 'draft' | 'publish';
  meta?: Record<string, unknown>;
}

export interface WpCourseResponse {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  status: string;
}
