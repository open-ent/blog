import { useEffect } from "react";

import { Editor } from "@edifice-ui/editor";
import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { ACTION } from "edifice-ts-client";
import { LoaderFunctionArgs } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { BlogHeader } from "~/features/Blog/BlogHeader";
import { PostTitle } from "~/features/Post/PostTitle";
import {
  availableActionsQuery,
  blogQuery,
  postsListQuery,
  useBlog,
  usePostsList,
} from "~/services/queries";

export const blogPrintLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);
    const actions = availableActionsQuery(blogActions);
    const queryPostsList = postsListQuery(
      params.blogId as string,
      0,
      undefined,
      undefined,
      true,
    );

    await Promise.all([
      queryClient.fetchQuery(actions),
      queryClient.fetchQuery(queryBlog),
      queryClient.fetchInfiniteQuery(queryPostsList),
    ]);

    return null;
  };

export function BlogPrint() {
  const { blog } = useBlog();
  const { hasRight } = useActionDefinitions(blogActions);

  const {
    posts,
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList(blog?._id, true);

  useEffect(() => {
    if (!hasRight(ACTION.PRINT)) {
      window.close();
    }
  }, [hasRight]);

  useEffect(() => {
    // Load all posts with recurcive fetchNextPage calls.
    if (isSuccess) {
      if (hasNextPage) {
        fetchNextPage();
      } else {
        window.print();
      }
    }
  }, [hasNextPage, isSuccess, fetchNextPage, data]);

  if (!blog) return <LoadingScreen />;

  return (
    <>
      <div className="px-16">
        <BlogHeader blog={blog} print={true} />
      </div>
      <div className="d-flex flex-fill bg-white">
        <div className="flex-fill py-16 ps-16 d-flex flex-column gap-16">
          {posts.map((post) => (
            <div className="rounded border pt-16">
              <PostTitle post={post} mode="print" />
              <div className="mx-32">
                <Editor
                  content={post.content}
                  mode="read"
                  variant="ghost"
                ></Editor>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
