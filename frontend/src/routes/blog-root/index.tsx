import { useTrashedResource } from '@edifice.io/react';
import { QueryClient } from '@tanstack/react-query';
import { LoaderFunctionArgs, Outlet, useParams } from 'react-router-dom';

import { useBlogErrorToast } from '~/hooks/useBlogErrorToast';
import { blogQuery } from '~/services/queries';

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const queryBlog = blogQuery(params.blogId as string);

    await queryClient.fetchQuery(queryBlog);

    return null;
  };

export function Component() {
  const { blogId } = useParams();

  useTrashedResource(blogId);
  useBlogErrorToast();

  return <Outlet />;
}
