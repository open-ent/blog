import { loadComments } from "../api";

/** Query comments data. */
export const commentListQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["comments", blogId, postId],
    queryFn: () => loadComments(blogId, postId),
  };
};
