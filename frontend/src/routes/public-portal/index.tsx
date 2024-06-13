import { useTrashedResource } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet, useLoaderData } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { useBlogErrorToast } from "~/hooks/useBlogErrorToast";
import { Blog } from "~/models/blog";
import { availableActionsQuery, blogPublicQuery } from "~/services/queries";

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { slug } = params;
    const queryBlogPublic = blogPublicQuery(slug as string);
    const blog = await queryClient.fetchQuery(queryBlogPublic);
    if (!blog._id) throw "Unexpected error";

    const actions = availableActionsQuery(blogActions);

    await Promise.all([queryClient.fetchQuery(actions)]);

    return { blog };
  };

export function Component() {
  const { blog } = useLoaderData() as { blog: Blog };

  useTrashedResource(blog._id);
  useBlogErrorToast();

  return <Outlet></Outlet>;
}
