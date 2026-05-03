'use client';

import { useParams } from 'next/navigation';
import { BlogCoursePostsPanel } from '../BlogCoursePostsPanel';

export default function DashboardBlogCoursePage() {
  const params = useParams();
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';

  if (!courseId) {
    return <p>Curso inválido</p>;
  }

  return <BlogCoursePostsPanel courseId={courseId} />;
}
