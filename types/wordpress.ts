export interface WpCreateCoursePayload {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'publish';
  featured_media?: number;
  meta?: Record<string, unknown>;
}

export interface WpCourseResponse {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  status: string;
}
