import { useEffect } from 'react';

import { Editor } from '@edifice-ui/editor';
import { LoadingScreen, useTrashedResource } from '@edifice-ui/react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { LoaderFunctionArgs, useLoaderData, useParams } from 'react-router-dom';

import { postContentActions } from '~/config/postContentActions';
import { PostTitle } from '~/features/Post/PostTitle';
import { PostMetadata } from '~/models/post';
import {
  availableActionsQuery,
  commentListQuery,
  postMetadataQuery,
  postQuery,
} from '~/services/queries';

/** Load a blog post content + comments to print it*/
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
  const { blogId } = useParams();
  useTrashedResource(blogId);

  const postMetadata = useLoaderData() as PostMetadata; // see loader above
  const { data: post } = useQuery(postQuery(blogId!, postMetadata));

  useEffect(() => {
    if (blogId && post) {
      setTimeout(() => window.print(), 1000);
    }
  }, [blogId, post]);

  if (!blogId || !post) return <LoadingScreen />;

  return (
    <>
      <div className="rounded border p-16 bg-white">
        <PostTitle post={post} mode="print" />
        <div className="mx-32">
          <Editor content={post.content} mode="read" variant="ghost" />
        </div>
      </div>
    </>
  );
}
