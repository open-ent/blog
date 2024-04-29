import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, Outlet } from "react-router-dom";

import { blogQuery } from "~/services/queries";

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);

    await queryClient.fetchQuery(queryBlog);

    return null;
  };

export function Component() {
  return <Outlet></Outlet>;
}
