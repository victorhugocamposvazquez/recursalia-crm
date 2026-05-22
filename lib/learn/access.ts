import { redirect, notFound } from 'next/navigation';
import {
  getSessionUser,
  getProfileRole,
  isEnrolled,
  getCourseByPublicSlug,
} from '@/lib/learn/lmsServer';

export async function requireLearnUser() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireCourseAccess(slug: string) {
  const user = await requireLearnUser();
  const course = await getCourseByPublicSlug(slug);
  if (!course) notFound();

  const role = await getProfileRole(user.id);
  if (role !== 'admin') {
    const enrolled = await isEnrolled(user.id, course.id);
    if (!enrolled) redirect('/aprender');
  }

  return { user, course, role };
}
