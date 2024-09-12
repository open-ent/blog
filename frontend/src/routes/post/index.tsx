import { QueryClient, useQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { PostContent } from "~/features/Post/PostContent";
import { PostHeader } from "~/features/Post/PostHeader";
import { PostMetadata } from "~/models/post";
import {
  availableActionsQuery,
  commentListQuery,
  postMetadataQuery,
  postQuery,
} from "~/services/queries";

/** Load a blog post content + comments */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    // Prefetch some data, if not done already
    const actions = availableActionsQuery(postContentActions);
    await queryClient.fetchQuery(actions);

    if (blogId && postId) {
      const comments = commentListQuery(blogId, postId);
      await queryClient.fetchQuery(comments);

      return await queryClient.fetchQuery(postMetadataQuery(blogId, postId));
    }

    return null;
  };

export function Component() {
  const { blogId, postId } = useParams();

  const postMetadata = useLoaderData() as PostMetadata; // see loader above
  const query = useQuery(postQuery(blogId!, postMetadata));
  const { data: comments } = useQuery(commentListQuery(blogId!, postId!));

  if (!blogId || !query.data) {
    return <></>;
  }

  return (
    <>
      <PostHeader />
      <PostContent
        blogId={blogId}
        post={query.data}
        comments={comments ?? []}
      />
    </>
  );
}
