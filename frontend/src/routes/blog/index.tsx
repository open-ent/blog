import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useParams } from "react-router-dom";

import BlogContent from "~/features/BlogContent/BlogContent";
import BlogHeader from "~/features/BlogHeader/BlogHeader";
import { blogQuery } from "~/services/queries";

export const blogLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const query = blogQuery(params.blogId as string);

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

export function Blog() {
  const params = useParams();
  const { data: blog } = useQuery(blogQuery(params.blogId as string));

  console.log({ blog });

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <BlogHeader />
      <BlogContent />
    </>
  );
}
