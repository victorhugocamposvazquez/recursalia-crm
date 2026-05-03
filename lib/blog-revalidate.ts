import { revalidatePath } from 'next/cache';

/** Tras publicar posts, fuerza nueva lectura ISR del índice y de cada slug. */
export function revalidatePublishedBlogPosts(slugs: string[]) {
  revalidatePath('/blog');
  for (const s of slugs) {
    if (s) revalidatePath(`/blog/${s}`);
  }
}
