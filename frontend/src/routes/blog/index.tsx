import { useEffect } from "react";

import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import BlogContent from "~/features/BlogContent/BlogContent";
import { BlogHeader } from "~/features/BlogHeader/BlogHeader";
import {
  blogCounterQuery,
  blogQuery,
  metadataPostsListQuery,
  useBlog,
  useMetadataPostsList,
} from "~/services/queries";

export const blogLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    const queryPostsList = metadataPostsListQuery(params.blogId as string);
    const queryBlogCounter = blogCounterQuery(params.blogId as string);

    const blog = await queryClient.fetchQuery(queryBlog);
    const postsList = await queryClient.fetchInfiniteQuery(queryPostsList);
    const blogCounter = await queryClient.fetchQuery(queryBlogCounter);

    return { blog, postsList, blogCounter };
  };

export function Blog() {
  const { blog } = useBlog();

  // Load all posts with recurcive fetchNextPage calls.
  const {
    posts,
    query: { fetchNextPage, hasNextPage, status },
  } = useMetadataPostsList();

  useEffect(() => {
    if (status === "success" && hasNextPage) {
      fetchNextPage();
    }
  }, [status, hasNextPage, fetchNextPage]);

  if (!blog && !posts) return <LoadingScreen />;

  return (
    <>
      <BlogHeader />
      <BlogContent />
    </>
  );
}
