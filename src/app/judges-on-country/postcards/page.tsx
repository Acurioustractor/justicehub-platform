import { PostcardsPageContent } from './postcards-content';

/**
 * Public postcards route — print deck + swap mode. No admin panels.
 * Admin route at /admin/judges-on-country/postcards mounts the same component
 * in 'admin' mode to expose source resolution and publication tools.
 */
export default function PostcardsPage() {
  return <PostcardsPageContent mode="public" />;
}
