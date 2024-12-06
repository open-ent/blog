import { AppHeader, Breadcrumb, useEdificeClient } from '@edifice.io/react';

import { Blog } from '~/models/blog';
import { BlogActionBar } from './BlogActionBar';

export interface BlogProps {
  blog: Blog;
  readonly?: boolean;
}

export const BlogHeader = ({ blog, readonly = false }: BlogProps) => {
  const { currentApp } = useEdificeClient();
  return (
    <AppHeader
      render={() => (!readonly ? <BlogActionBar blog={blog} /> : null)}
    >
      {currentApp && <Breadcrumb app={currentApp} name={blog.title} />}
    </AppHeader>
  );
};
