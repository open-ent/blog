import { QueryClient, useQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { CommentsCreate } from "~/features/Comments/CommentsCreate";
import { CommentsHeader } from "~/features/Comments/CommentsHeader";
import { CommentsList } from "~/features/Comments/CommentsList";
import { PostContent } from "~/features/Post/PostContent";
import { PostHeader } from "~/features/Post/PostHeader";
import { useBlogErrorToast } from "~/hooks/useBlogErrorToast";
import { PostMetadata } from "~/models/post";
import { loadPostMetadata } from "~/services/api";
import {
  availableActionsQuery,
  commentListQuery,
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

      return await loadPostMetadata(blogId, postId);
    }

    return null;
  };

export function Component() {
  useBlogErrorToast();
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
      <div className="post-container mx-auto mb-48">
        <PostContent blogId={blogId} post={query.data} />
        <CommentsHeader comments={comments ?? []} />
        <CommentsCreate comments={comments ?? []} />
        <CommentsList comments={comments ?? []} />
      </div>
    </>
  );
}
