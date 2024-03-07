import { useMutation, useQueryClient } from "@tanstack/react-query";

import { blogCounterQuery, blogQueryKeys } from "./blog";
import {
  createPost,
  deletePost,
  loadOriginalPost,
  loadPost,
  goUpPost,
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
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.postsList(blogId),
        }),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => goUpPost(blogId, postId),
    onSuccess: () => {
      // Publishing a post invalidates some queries.
      return queryClient.invalidateQueries({
        queryKey: blogQueryKeys.postsList(blogId),
      });
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
        queryClient.invalidateQueries({
          queryKey: blogQueryKeys.postsList(blogId),
        }),
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
    mutationFn: ({
      post,
      publishWith = "publish",
    }: {
      post: Post;
      publishWith?: "publish" | "submit";
    }) => publishPost(blogId, post, publishWith),
    onSuccess: (_data, { post, publishWith }) => {
      // Publishing/submitting a post change its state. Update the query data accordingly.
      // Use the state which is sent back, or guess it from the publish/submit mess.
      queryClient.setQueryData(postQuery(blogId, post).queryKey, {
        ...post,
        state:
          _data?.state ?? publishWith === "submit"
            ? PostState.SUBMITTED
            : PostState.PUBLISHED,
      });

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
