import { useEffect } from "react";

import { useOdeTheme } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  LoaderFunctionArgs,
  matchPath,
  redirect,
  useLoaderData,
} from "react-router-dom";

import { Post } from "~/models/post";
import { postQuery } from "~/services/queries";

/** Load a blog post content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    if (blogId && postId) {
      const query = postQuery(blogId, postId);
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    }
    return Promise.resolve(null);
  };

export const Component = () => {
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

/** A loader that manages angularJs-styled routes. */
export const LoadNgRoutes = () => {
  if (!location.hash?.startsWith("#")) return redirect("/");

  const ngLocation = location.hash.substring(1);
  const blog = matchPath("/view/:blogId", ngLocation);
  if (blog) {
    return redirect(`id/${blog.params.blogId}`);
  }

  const post = matchPath("/detail/:blogId/:postId", ngLocation);
  if (post) {
    return redirect(`id/${post.params.blogId}/post/${post.params.postId}`);
  }

  throw "404";
};
