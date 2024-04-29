import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { useBlogErrorToast } from "~/hooks/useBlogErrorToast";
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
  useBlogErrorToast();

  return <Outlet></Outlet>;
}
