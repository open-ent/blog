import { useEffect } from 'react';

import { QueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { createPostActions } from '~/config/createPostActions';
import { useActionDefinitions } from '~/features/ActionBar/useActionDefinitions';
import { CreatePost } from '~/features/Post/CreatePost';
import { PostHeader } from '~/features/Post/PostHeader';
import { useBlogErrorToast } from '~/hooks/useBlogErrorToast';
import { availableActionsQuery } from '~/services/queries';

export const loader = (queryClient: QueryClient) => async () => {
  // Preload needed rights
  const actionsQuery = availableActionsQuery(createPostActions);
  await queryClient.fetchQuery(actionsQuery);
  return null;
};

export function Component() {
  useBlogErrorToast();
  const { blogId } = useParams();
  const navigate = useNavigate();
  // Check for the right to create a new post
  const { canContrib } = useActionDefinitions(createPostActions);

  useEffect(() => {
    // If the user cannot contrib, go back to the blog
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    canContrib || navigate(`../..`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!blogId) {
    return <></>;
  }

  return (
    <>
      <PostHeader />
      <CreatePost blogId={blogId} />
    </>
  );
}
