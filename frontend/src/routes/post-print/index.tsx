import { useEffect } from "react";

import { Editor } from "@edifice-ui/editor";
import { LoadingScreen } from "@edifice-ui/react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { ACTION } from "edifice-ts-client";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { blogContentActions } from "~/config/blogContentActions";
import { postContentActions } from "~/config/postContentActions";
import { useActionDefinitions } from "~/features/ActionBar/useActionDefinitions";
import { CommentsHeader } from "~/features/Comments/CommentsHeader";
import { CommentsList } from "~/features/Comments/CommentsList";
import { PostTitle } from "~/features/Post/PostTitle";
import { PostMetadata } from "~/models/post";
import { loadPostMetadata } from "~/services/api";
import {
  availableActionsQuery,
  commentListQuery,
  postQuery,
} from "~/services/queries";

/** Load a blog post content + comments to print it*/
export const postPrintLoader =
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

export function PostPrint() {
  const { blogId, postId } = useParams();
  const { hasRight } = useActionDefinitions(blogContentActions);
  const postMetadata = useLoaderData() as PostMetadata; // see loader above
  const { data: post } = useQuery(postQuery(blogId!, postMetadata));
  const { data: comments } = useQuery(commentListQuery(blogId!, postId!));

  useEffect(() => {
    if (!hasRight(ACTION.PRINT)) {
      window.close();
    }
  }, [hasRight]);

  useEffect(() => {
    if (blogId && post) {
      setTimeout(() => window.print(), 1000);
    }
  }, [blogId, post]);

  if (!blogId || !post) return <LoadingScreen />;

  return (
    <>
      <div className="rounded border pt-16">
        <PostTitle post={post} mode="print" />
        <div className="mx-32">
          <Editor content={post.content} mode="read" variant="ghost"></Editor>
        </div>
        <div className="mx-md-16 mx-lg-64">
          <CommentsHeader comments={comments ?? []} />
          <CommentsList comments={comments ?? []} />
        </div>
      </div>
    </>
  );
}
