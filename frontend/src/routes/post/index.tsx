import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { PostProvider } from "~/features/Post/PostProvider";
import { PostViewContent } from "~/features/Post/PostViewContent";
import { PostViewHeader } from "~/features/Post/PostViewHeader";
import { Post } from "~/models/post";
import { loadPostMetadata } from "~/services/api";
import { availableActionsQuery, postQuery } from "~/services/queries";

/** Load a blog post content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    // Prefetch some data, if not done already
    const actions = availableActionsQuery(postContentActions);
    await queryClient.fetchQuery(actions);

    if (blogId && postId) {
      const postMetadata = await loadPostMetadata(blogId, postId);
      const query = postQuery(blogId, postMetadata);
      const post = await queryClient.fetchQuery(query);
      return post;
    }

    return null;
  };

export function Component() {
  const { blogId } = useParams();
  const post = useLoaderData() as Post | null;

  if (!blogId || !post) {
    return <></>;
  }

  return (
    <PostProvider blogId={blogId} post={post}>
      <PostViewHeader />
      <PostViewContent />
    </PostProvider>
  );
}
