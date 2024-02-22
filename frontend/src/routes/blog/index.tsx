import { useEffect } from "react";

import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import { BlogFilter } from "~/features/BlogFilter/BlogFilter";
import { BlogHeader } from "~/features/BlogHeader/BlogHeader";
import BlogPostList from "~/features/BlogPostList/BlogPostList";
import BlogSidebar from "~/features/BlogSidebar/BlogSidebar";
import { PostState } from "~/models/post";
import {
  blogCounterQuery,
  blogQuery,
  postsListQuery,
  useBlog,
  useBlogCounter,
  usePostsList,
} from "~/services/queries";
import { useStoreUpdaters } from "~/store";

export const blogLoader =
  (queryClient: QueryClient) =>
  async ({ params, request }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    const queryBlogCounter = blogCounterQuery(params.blogId as string);

    const url = new URL(request.url);
    const state =
      (url.searchParams.get("state") as PostState) || PostState.PUBLISHED;
    const search = url.searchParams.get("search") || "";
    const queryPostsList = postsListQuery(
      params.blogId as string,
      0,
      search,
      state,
    );

    const blog = await queryClient.fetchQuery(queryBlog);
    const postsList = await queryClient.fetchInfiniteQuery(queryPostsList);
    const blogCounter = await queryClient.fetchQuery(queryBlogCounter);

    return { blog, postsList, blogCounter };
  };

export function Blog() {
  const { blog } = useBlog();
  const { counters } = useBlogCounter();
  const { setPostPageSize } = useStoreUpdaters();

  // Load all posts with recurcive fetchNextPage calls.
  const {
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList();

  useEffect(() => {
    // Check if the second page of post is not null to set the page size. (not given by the backend)
    if (hasNextPage && data?.pageParams.includes(1) && data?.pages[0]) {
      setPostPageSize(data?.pages[0].length);
    }

    // Load at least the 2 first pages of posts to display the page.
    if (
      isSuccess &&
      hasNextPage &&
      data?.pageParams?.length &&
      data?.pageParams?.length < 2
    ) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, isSuccess, fetchNextPage, data]);

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <BlogHeader />
      <div className="d-flex flex-fill">
        <BlogSidebar />
        <div className="flex-fill py-16 ps-16 d-flex flex-column">
          {!!counters?.countAll && <BlogFilter />}
          <BlogPostList />
        </div>
      </div>
    </>
  );
}
