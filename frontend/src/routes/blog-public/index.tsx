import { useEffect } from "react";

import { Editor } from "@edifice-ui/editor";
import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router-dom";

import { blogActions } from "~/config/blogActions";
import { BlogHeader } from "~/features/Blog/BlogHeader";
import BlogSidebar from "~/features/Blog/BlogSidebar";
import { PostTitle } from "~/features/Post/PostTitle";
import { PostState } from "~/models/post";
import {
  availableActionsQuery,
  blogPublicQuery,
  postsListQuery,
  useBlog,
  usePostsList,
} from "~/services/queries";

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlogPublic = blogPublicQuery(params.slug as string);
    const blog = await queryClient.fetchQuery(queryBlogPublic);
    if (!blog._id) throw "Unexpected error";

    const actions = availableActionsQuery(blogActions);
    const queryPostsList = postsListQuery(
      blog._id as string,
      0,
      PostState.PUBLISHED,
      undefined,
      false,
    );

    await Promise.all([
      queryClient.fetchQuery(actions),
      queryClient.fetchInfiniteQuery(queryPostsList),
    ]);

    return null;
  };

export function Component() {
  const { blog } = useBlog();

  const {
    posts,
    query: { fetchNextPage, hasNextPage, isSuccess, data },
  } = usePostsList(blog?._id, PostState.PUBLISHED, false);

  useEffect(() => {
    // Load all posts with recursive fetchNextPage calls.
    isSuccess && hasNextPage && fetchNextPage();
  }, [hasNextPage, isSuccess, fetchNextPage, data]);

  if (!blog) return <LoadingScreen />;

  return (
    <main className="container-fluid d-flex flex-column bg-white">
      {!isSuccess && hasNextPage && <LoadingScreen />}

      <div className="px-16">
        <BlogHeader blog={blog} print={true} />
      </div>

      <div className="d-flex flex-fill bg-white">
        <BlogSidebar state={PostState.PUBLISHED} />

        <div className="flex-fill py-16 ps-md-16 d-flex flex-column gap-16">
          {posts.map((post) => (
            <div key={post._id} className="card p-24">
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
    </main>
  );
}
