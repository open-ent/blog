import { useEffect } from "react";

import { useOdeTheme, useTrashedResource } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { Post } from "~/models/post";
import { originalPostQuery, postMetadataQuery } from "~/services/queries";

/** Load a blog post OLD-FORMAT content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    if (blogId && postId) {
      const postMetadata = await queryClient.fetchQuery(
        postMetadataQuery(blogId, postId),
      );
      const query = originalPostQuery(blogId, postMetadata);
      const post = await queryClient.fetchQuery(query);
      return post;
    }

    return null;
  };

export const Component = () => {
  const { blogId } = useParams();
  useTrashedResource(blogId);

  const post = useLoaderData() as Post | null;
  const { theme } = useOdeTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const link = document.getElementById("theme") as HTMLAnchorElement;
    if (link) link.href = `${theme?.themeUrl}theme.css`;
  }, [theme?.themeUrl]);

  const style = {
    margin: "auto",
    padding: "16px",
    minHeight: "100vh",
    backgroundColor: "#fff",
  };

  return (
    <div
      style={style}
      contentEditable={false}
      dangerouslySetInnerHTML={{
        __html:
          post?.content ??
          t("<p>I am sorry Dave, I am afraid I cannot do that.</p>"),
      }}
    />
  );
};
