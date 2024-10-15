import { useToast } from '@edifice-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { blogCounterQuery, blogQueryKeys } from './blog';
import { commentListQuery } from './comment';
import { loadPostsReactionsSummary } from '../api';
import {
  createPost,
  deletePost,
  loadOriginalPost,
  loadPost,
  goUpPost,
  publishPost,
  savePost,
  loadPublicPost,
  loadPostMetadata,
} from '../api/post';
import { Post, PostMetadata, PostState } from '~/models/post';

/** Query metadata of a post */
export const postMetadataQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ['postMeta', blogId, postId],
    queryFn: () => loadPostMetadata(blogId, postId),
  };
};
/** Query metadata of a post */
export const postQuery = (blogId: string, post: PostMetadata) => {
  return {
    queryKey: ['post', blogId, post._id],
    queryFn: () => loadPost(blogId, post),
  };
};

export const originalPostQuery = (blogId: string, post: PostMetadata) => {
  return {
    queryKey: ['original-post', blogId, post._id],
    queryFn: () => loadOriginalPost(blogId, post),
  };
};

/** Query a public post */
export const publicPostQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ['public-post', blogId, postId],
    queryFn: () => loadPublicPost(blogId, postId),
  };
};

export const useCreatePost = (blogId: string) => {
  const toast = useToast();
  const { t } = useTranslation('blog');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      createPost(blogId, title, content),
    onSuccess: (post: Post) => {
      // Save the new post in the cache.
      queryClient.setQueryData(postQuery(blogId, post).queryKey, post);
      queryClient.setQueryData(
        postMetadataQuery(blogId, post._id).queryKey,
        post,
      );
      queryClient.setQueryData(commentListQuery(blogId, post._id).queryKey, []);

      toast.success(t('blog.post.create.success'));
      return Promise.all([
        // Publishing a post invalidates some queries.
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.postsList(blogId),
        }),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
      ]);
    },
  });
};

export const useSavePost = (blogId: string, post: Post) => {
  const toast = useToast();
  const { t } = useTranslation('blog');
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line no-empty-pattern
    mutationFn: ({}: { withoutNotification?: boolean }) =>
      savePost(blogId, post),
    onSuccess: (result, { withoutNotification }) => {
      // Saving a post may change its state. Update the query data accordingly.
      const updatedPost = {
        ...post,
        state: result.state,
      };
      queryClient.setQueryData(postQuery(blogId, post).queryKey, updatedPost);
      queryClient.setQueryData(
        postMetadataQuery(blogId, post._id).queryKey,
        updatedPost,
      );

      if (!withoutNotification) {
        toast.success(t('blog.post.save.success'));
      }

      return Promise.all([
        // Publishing a post invalidates some queries.
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.postsList(blogId),
        }),
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.counter(blogId),
        }),
      ]);
    },
  });
};

export const useGoUpPost = (blogId: string, postId: string) => {
  const toast = useToast();
  const { t } = useTranslation('blog');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => goUpPost(blogId, postId),
    onSuccess: () => {
      toast.success(t('blog.post.goup.success'));
      // Publishing a post invalidates some queries.
      return queryClient.invalidateQueries({
        queryKey: blogQueryKeys.postsList(blogId),
      });
    },
  });
};

export const useDeletePost = (blogId: string, postId: string) => {
  const toast = useToast();
  const { t } = useTranslation('blog');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePost(blogId, postId),
    onSuccess: () => {
      toast.success(t('blog.post.delete.success'));

      return Promise.all([
        // Deleting a post invalidates some queries.
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.postsList(blogId),
        }),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
        Promise.resolve(
          queryClient.removeQueries(
            postQuery(blogId, { _id: postId } as PostMetadata),
          ),
        ),
      ]);
    },
  });
};

export const usePublishPost = (blogId: string) => {
  const toast = useToast();
  const { t } = useTranslation('blog');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      post,
      publishWith = 'publish',
      fromEditor,
    }: {
      post: Post;
      publishWith?: 'publish' | 'submit';
      fromEditor?: boolean;
    }) => publishPost(blogId, post, publishWith, fromEditor),
    onSuccess: (result, { post, publishWith }) => {
      // Publishing/submitting a post change its state. Update the query data accordingly.
      // Use the state which is sent back, or guess it from the publish/submit mess.
      const updatedPost = {
        ...post,
        state:
          result.state ||
          (publishWith === 'publish'
            ? PostState.PUBLISHED
            : PostState.SUBMITTED),
      };
      queryClient.setQueryData(postQuery(blogId, post).queryKey, updatedPost);
      queryClient.setQueryData(
        postMetadataQuery(blogId, post._id).queryKey,
        updatedPost,
      );

      toast.success(
        t(
          `blog.post.${result.state === PostState.PUBLISHED ? 'publish' : 'submit'}.success`,
        ),
      );

      return Promise.all([
        // Publishing a post invalidates some queries.
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.postsList(blogId),
        }),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
      ]);
    },
  });
};
/**
 *
 * @param resourceIds the list of post ids
 * @returns
 */
export const useGetPostsReactionSummary = (resourceIds: string[]) => {
  const query = useQuery({
    queryKey: ['post-reaction-summary', resourceIds],
    queryFn: () => loadPostsReactionsSummary(resourceIds),
  });

  return {
    counters: query.data,
    query,
  };
};
