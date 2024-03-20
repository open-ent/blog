import { useEffect } from "react";

import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { useBlogErrorToast } from "~/hooks/useBlogErrorToast";
import { PostState } from "~/models/post";
import {
  availableActionsQuery,
  blogPublicQuery,
  postsListQuery,
  useBlog,
  usePostsList,
} from "~/services/queries";
import { useStoreUpdaters } from "~/store";

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { slug } = params;
    const queryBlogPublic = blogPublicQuery(slug as string);
    const blog = await queryClient.fetchQuery(queryBlogPublic);
    if (!blog._id) throw "Unexpected error";

    const actions = availableActionsQuery(blogActions);
    const queryPostsList = postsListQuery(
      blog._id as string,
      0,
      PostState.PUBLISHED,
      undefined,
      false,
      true,
    );

    await Promise.all([
      queryClient.fetchQuery(actions),
      queryClient.fetchInfiniteQuery(queryPostsList),
    ]);

    return { blog };
  };

export function Component() {
  useBlogErrorToast();
  const { blog } = useBlog();
  const { setPostPageSize } = useStoreUpdaters();
  // Load all posts with recurcive fetchNextPage calls.
  const {
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList(blog?._id, PostState.PUBLISHED, false);

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

  return <Outlet></Outlet>;
}
