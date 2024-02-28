import { useMutation, useQueryClient } from "@tanstack/react-query";

import { blogCounterQuery, postsListQuery } from "./blog";
import {
  createPost,
  deletePost,
  loadOriginalPost,
  loadPost,
  publishPost,
  savePost,
} from "../api/post";
import { Post, PostMetadata, PostState } from "~/models/post";

/** Query metadata of a post */
export const postQuery = (blogId: string, post: PostMetadata) => {
  return {
    queryKey: ["post", post._id, post.state],
    queryFn: () => loadPost(blogId, post),
  };
};

export const originalPostQuery = (blogId: string, post: PostMetadata) => {
  return {
    queryKey: ["original-post", post._id, post.state],
    queryFn: () => loadOriginalPost(blogId, post),
  };
};

export const useCreatePost = (blogId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      createPost(blogId, title, content),
    onSuccess: () => {
      return Promise.all([
        // Publishing a post invalidates some queries.
        queryClient.invalidateQueries(postsListQuery(blogId)),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
      ]);
    },
  });
};

export const useSavePost = (blogId: string, post: Post) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => savePost(blogId, post),
    onSuccess: (result) => {
      // Saving a post may change its state. Update the query data accordingly.
      queryClient.setQueryData(postQuery(blogId, post).queryKey, {
        ...post,
        state: result.state,
      });

      return Promise.all([
        // Publishing a post invalidates some queries.
        queryClient.invalidateQueries(postsListQuery(blogId)),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
      ]);
    },
  });
};

export const useDeletePost = (blogId: string, postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePost(blogId, postId),
    onSuccess: () =>
      Promise.all([
        // Deleting a post invalidates some queries.
        queryClient.invalidateQueries(postsListQuery(blogId)),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
        Promise.resolve(
          queryClient.removeQueries(
            postQuery(blogId, { _id: postId } as PostMetadata),
          ),
        ),
      ]),
  });
};

export const usePublishPost = (blogId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ post, mustSubmit }: { post: Post; mustSubmit: boolean }) =>
      publishPost(blogId, post, mustSubmit),
    onSuccess: (_data, { post, mustSubmit }) => {
      // Publishing/submitting a post change its state. Update the query data accordingly.
      post.state = mustSubmit ? PostState.SUBMITTED : PostState.PUBLISHED;
      queryClient.setQueryData(postQuery(blogId, post).queryKey, post);

      return Promise.all([
        // Publishing a post invalidates some queries.
        queryClient.invalidateQueries(postsListQuery(blogId)),
        queryClient.invalidateQueries(blogCounterQuery(blogId)),
      ]);
    },
  });
};
