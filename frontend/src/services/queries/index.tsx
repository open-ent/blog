import { useUpdateMutation } from "@edifice-ui/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { IAction, UpdateParameters, UpdateResult } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import {
  deletePost,
  loadBlog,
  loadBlogCounter,
  loadOriginalPost,
  loadPost,
  loadPostsList,
  savePost,
  sessionHasWorkflowRights,
} from "../api";
import usePostsFilter from "~/hooks/usePostsFilter";
import { Blog } from "~/models/blog";
import { Post, PostMetadata, PostState } from "~/models/post";
import { usePostPageSize } from "~/store";
import { IActionDefinition } from "~/utils/types";

/** Query metadata of a blog */
export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: () => loadBlog(blogId),
  };
};

export const blogCounterQuery = (blogId: string) => {
  return {
    queryKey: ["blog", "counter", blogId],
    queryFn: () => loadBlogCounter(blogId),
  };
};

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

export const postsListQuery = (
  blogId: string,
  pageSize?: number,
  search?: string,
  state?: PostState,
) => {
  const queryKey: any = { state, search };
  return {
    queryKey: ["postList", blogId, queryKey],
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, state ?? PostState.PUBLISHED, search),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, _allPages: any, lastPageParam: any) => {
      if (
        (pageSize && lastPage.length < pageSize) ||
        (!pageSize && lastPage.length === 0)
      ) {
        return undefined;
      }
      return lastPageParam + 1;
    },
  };
};

/** Query actions availability depending on workflow rights */
export const availableActionsQuery = (actions: IActionDefinition[]) => {
  const actionRights = actions.map((action) => action.workflow);
  return {
    queryKey: actionRights,
    queryFn: async () => await sessionHasWorkflowRights(actionRights),
    select: (data: Record<string, boolean>) => {
      return actions.map((action) => ({
        ...action,
        available: data[action.workflow],
      })) as IAction[];
    },
    staleTime: Infinity,
  };
};

/**
 * useBlog query
 * @param blogId the blog id string
 * @returns blog data
 */
export const useBlog = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogQuery(blogId!));

  return {
    blog: query.data,
    query,
  };
};

/**
 * useBlogCounter query
 * @param blogId the blog id string
 * @returns counters of posts by state for on specific blogId
 */
export const useBlogCounter = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogCounterQuery(blogId!));

  return {
    counters: query.data,
    query,
  };
};

/**
 * useMetadataPostsList query
 * @param blogId the blog id string
 * @returns list of posts metadata
 */
export const usePostsList = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  const { postsFilters } = usePostsFilter();
  const pageSize = usePostPageSize();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const query = useInfiniteQuery(
    postsListQuery(blogId!, pageSize, postsFilters.search, postsFilters.state),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
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

export const useUpdateBlog = (blog: Blog) => {
  const queryClient = useQueryClient();
  return useUpdateMutation({
    application: "blog",
    options: {
      onSuccess: async (
        _data: UpdateResult,
        { name, description, public: pub, slug, thumbnail }: UpdateParameters,
      ) => {
        const updatedBlog: Blog = {
          ...blog,
          title: name,
          description: description,
          thumbnail:
            typeof thumbnail === "string"
              ? thumbnail
              : URL.createObjectURL(thumbnail as Blob | MediaSource),
          visibility: pub ? "PUBLIC" : "OWNER",
          slug: slug,
        };
        queryClient.setQueryData(blogQuery(blog._id).queryKey, updatedBlog);
      },
    },
  });
};
