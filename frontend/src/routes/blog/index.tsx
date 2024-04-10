import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { Blog } from "~/features/Blog/Blog";
import { PostState } from "~/models/post";
import {
  availableActionsQuery,
  blogCounterQuery,
  blogQuery,
  postsListQuery,
} from "~/services/queries";

export const loader =
  (queryClient: QueryClient) =>
  async ({ params, request }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    const queryBlogCounter = blogCounterQuery(params.blogId as string);
    const actions = availableActionsQuery(blogActions);

    const url = new URL(request.url);
    const state =
      (url.searchParams.get("state") as PostState) || PostState.PUBLISHED;
    const search = url.searchParams.get("search") || "";
    const queryPostsList = postsListQuery(
      params.blogId as string,
      0,
      state,
      search,
    );

    await Promise.all([
      queryClient.fetchQuery(queryBlog),
      queryClient.fetchInfiniteQuery(queryPostsList),
      queryClient.fetchQuery(queryBlogCounter),
      queryClient.fetchQuery(actions),
    ]);

    return null;
  };

export function Component() {
  return <Blog></Blog>;
}
