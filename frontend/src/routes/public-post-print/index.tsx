import { useEffect } from 'react';

import { Editor } from '@edifice-ui/editor';
import { LoadingScreen } from '@edifice-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouteLoaderData } from 'react-router-dom';

import { PostTitle } from '~/features/Post/PostTitle';
import { Blog } from '~/models/blog';
import { publicPostQuery } from '~/services/queries';

export function Component() {
  const { blog } = useRouteLoaderData('public-portal') as { blog: Blog }; // see public-portal loader
  const { postId } = useParams();
  const { data: post } = useQuery(publicPostQuery(blog._id, postId!));

  useEffect(() => {
    if (blog._id && post) {
      const timer = setTimeout(() => window.print(), 1000);
      return () => clearTimeout(timer);
    }
  }, [blog._id, post]);

  if (!blog._id || !post) return <LoadingScreen />;

  return (
    <div className="rounded border pt-16 bg-white">
      <PostTitle post={post} mode="print" />
      <div className="mx-32">
        <Editor content={post.content} mode="read" variant="ghost" />
      </div>
    </div>
  );
}
