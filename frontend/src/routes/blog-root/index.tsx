import { checkUserRight, useTrashedResource } from '@edifice.io/react';
import { QueryClient } from '@tanstack/react-query';
import { LoaderFunctionArgs, Outlet, useParams } from 'react-router-dom';

import { useBlogErrorToast } from '~/hooks/useBlogErrorToast';
import { blogQuery } from '~/services/queries';
import { getUserRightsActions } from '~/store';

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);

    const blog = await queryClient.fetchQuery(queryBlog);

    /**
     * Fetch user's right with correct store and methods
     * Should replace useActionDefinitions
     */
    const userRights = await checkUserRight(blog.rights, 'comment');
    const { setUserRights } = getUserRightsActions();
    setUserRights(userRights);

    return null;
  };

export function Component() {
  const { blogId } = useParams();

  useTrashedResource(blogId);
  useBlogErrorToast();

  return <Outlet />;
}
