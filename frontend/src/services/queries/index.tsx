import { useQuery } from "@tanstack/react-query";

import { loadBlog, loadPost } from "../api";

export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: () => loadBlog(blogId),
  };
};

export const postQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["post", postId],
    queryFn: () => loadPost(blogId, postId),
  };
};

/**
 * useBlog query
 * @returns blog data
 */
export const useBlog = (blogId: string) => {
  const query = useQuery(blogQuery(blogId));

  return {
    blog: query.data,
    query,
  };
};

/**
 * usePost query
 * @returns post data
 */
export const usePost = (blogId: string, postId: string) => {
  const query = useQuery(postQuery(blogId, postId));

  return {
    post: query.data,
    query,
  };
};
