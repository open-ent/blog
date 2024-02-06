import { useEffect } from "react";

import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import BlogContent from "~/features/BlogContent/BlogContent";
import {
  blogQuery,
  postsListQuery,
  useBlog,
  usePostsList,
} from "~/services/queries";

export const blogLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    const queryPostsList = postsListQuery(params.blogId as string, 0);

    const blog = await queryClient.fetchQuery(queryBlog);
    const postsList = await queryClient.fetchInfiniteQuery(queryPostsList);

    return { blog, postsList };
  };

export function Blog() {
  const { blog } = useBlog();

  // Load all posts with recurcive fetchNextPage calls.
  const {
    posts,
    query: { fetchNextPage, hasNextPage, status },
  } = usePostsList();

  useEffect(() => {
    if (status === "success" && hasNextPage) {
      fetchNextPage();
    }
  }, [status, hasNextPage, fetchNextPage]);

  if (!blog && !posts) return <LoadingScreen />;

  return (
    <>
      <BlogContent />
    </>
  );
}
