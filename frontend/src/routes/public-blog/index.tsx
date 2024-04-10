import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { Blog } from "~/features/Blog/Blog";
import { PostState } from "~/models/post";
import {
  availableActionsQuery,
  blogPublicQuery,
  postsListQuery,
} from "~/services/queries";

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
  return (
    <main className="container-fluid d-flex flex-column bg-white">
      <Blog></Blog>
    </main>
  );
}
