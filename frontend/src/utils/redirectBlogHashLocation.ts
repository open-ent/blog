import { matchPath, redirect } from "react-router-dom";

/* Check location and redirect to the new URL if needed
 * @returns redirect response if redirect needed, null otherwise
 */
export function redirectBlogHashLocation(): Response | null {
  const hashLocation = location.hash.substring(1);

  // Check if the URL is an old format (angular root with hash) and redirect to the new format
  if (hashLocation) {
    const isBlogPath = matchPath("/view/:blogId", hashLocation);
    if (isBlogPath) {
      // Redirect to the new format
      const redirectPath = `/id/${isBlogPath?.params.blogId}`;
      return redirect(redirectPath);
    }

    const isPostPath = matchPath("/detail/:blogId/:postId", hashLocation);
    if (isPostPath) {
      // Redirect to the new format
      const redirectPath = `/id/${isPostPath?.params.blogId}/post/${isPostPath?.params.postId}`;
      return redirect(redirectPath);
    }
  }

  return null;
}
