import { AppHeader, Breadcrumb, useOdeClient } from '@edifice-ui/react';

import { BlogActionBar } from './BlogActionBar';
import { Blog } from '~/models/blog';

export interface BlogProps {
  blog: Blog;
  readonly?: boolean;
}

export const BlogHeader = ({ blog, readonly = false }: BlogProps) => {
  const { currentApp } = useOdeClient();
  return (
    <AppHeader
      render={() => (!readonly ? <BlogActionBar blog={blog} /> : null)}
    >
      {currentApp && <Breadcrumb app={currentApp} name={blog.title} />}
    </AppHeader>
  );
};
