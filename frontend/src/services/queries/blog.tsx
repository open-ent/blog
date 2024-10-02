import { useCallback, useEffect } from 'react';

import { useToast } from '@edifice-ui/react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { IAction, odeServices } from 'edifice-ts-client';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import {
  loadBlog,
  loadBlogCounter,
  loadBlogPublic,
  loadPostsList,
  loadPostsReactionsSummary,
  loadPostsViewsCounter,
  sessionHasWorkflowRights,
} from '../api/blog';
import usePostsFilter from '~/hooks/usePostsFilter';
import { Post, PostState } from '~/models/post';
import { useBlogStore } from '~/store';
import { IActionDefinition } from '~/utils/types';

export const blogQueryKeys = {
  all: (blogId: string) => ['blog', blogId],
  counter: (blogId: string) => [...blogQueryKeys.all(blogId), 'counter'],
  postsList: (
    blogId: string,
    state?: PostState,
    search?: string,
    isPublic?: boolean,
  ) => {
    const queryKey = [...blogQueryKeys.all(blogId), 'postsList'];
    const queryKeyFilter: any = {};
    if (state || search || isPublic) {
      if (state) {
        queryKeyFilter.state = state;
      }
      if (search) {
        queryKeyFilter.search = search;
      }
      if (isPublic) {
        queryKeyFilter.isPublic = true;
      }
      queryKey.push(queryKeyFilter);
    }
    return queryKey;
  },
  public: (slug: string) => ['public blog', slug],
  postsViewsCounters: (ressourceIds: string[]) => [
    'postsViewsCounter',
    ressourceIds,
  ],
};

/** Query blog data */
export const blogQuery = (blogId: string) => {
  return {
    queryKey: blogQueryKeys.all(blogId),
    queryFn: () => loadBlog(blogId),
  };
};

/** Query public blog data */
export const blogPublicQuery = (slug: string) => {
  return {
    queryKey: blogQueryKeys.public(slug),
    queryFn: () => loadBlogPublic(slug),
  };
};

export const blogCounterQuery = (blogId: string) => {
  return {
    queryKey: blogQueryKeys.counter(blogId),
    queryFn: () => loadBlogCounter(blogId),
  };
};

export const postsViewsCountersQuery = (resourceIds: string[]) => {
  return {
    queryKey: blogQueryKeys.postsViewsCounters(resourceIds),
    queryFn: () => loadPostsViewsCounter(resourceIds),
  };
};

export const postsListQuery = (
  blogId: string,
  pageSize?: number,
  state?: PostState,
  search?: string,
  nbComments: boolean = true,
  isPublic: boolean = false,
) => {
  return {
    queryKey: blogQueryKeys.postsList(blogId, state, search, isPublic),
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, state, search, nbComments, isPublic),

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
      return actions
        .filter((action: IAction) => data[action.workflow])
        .map((action) => ({
          ...action,
          available: true,
        })) as IAction[];
    },
    staleTime: Infinity,
  };
};

/**
 * useBlog query
 * @param blogId optional blog id string
 * @param slug optional blog slug string
 * @returns blog data
 */
export const useBlog = (blogId?: string, slug?: string) => {
  const params = useParams<{ blogId: string; slug: string }>();
  if (!blogId) blogId = params.blogId;
  if (!slug) slug = params.slug;

  let queryOptions = blogQuery(blogId!); // Default options
  if (!blogId) {
    if (!slug) {
      console.error('no blogId nor slug is defined');
    } else {
      queryOptions = blogPublicQuery(slug!);
    }
  }
  const query = useQuery(queryOptions);

  return {
    blog: query.data,
    query,
    publicView: !!slug,
    isPublicBlog: !!slug || query.data?.visibility === 'PUBLIC',
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
      console.error('blogId is not defined');
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogCounterQuery(blogId!));

  return {
    counters: query.data,
    query,
  };
};

export type usePostsListProps = {
  blogId?: string;
  state?: PostState;
  withNbComments: boolean;
  withViews: boolean;
};

/**
 * usePostsList query
 * @param blogId the blog id string
 * @param state filter posts on their state
 * @param withNbComments fetch comments number
 * @param withViews fetch views number (implies additional requests to the backend)
 * @returns list of posts
 */
export const usePostsList = ({
  blogId,
  state,
  withNbComments = true,
  withViews = false,
}: usePostsListProps) => {
  const params = useParams<{ blogId: string; slug: string }>();
  const { postsFilters } = usePostsFilter();
  const { addPostsViewsCounters, addPostsReactionsSummary, postPageSize } =
    useBlogStore(
      useShallow((state) => ({
        addPostsViewsCounters: state.addPostsViewsCounters,
        addPostsReactionsSummary: state.addPostsReactionsSummary,
        postPageSize: state.postPageSize,
      })),
    );

  if (!blogId) {
    if (!params.blogId) {
      console.error('blogId is not defined');
    }
    blogId = params.blogId;
  }

  const publicView = !!params.slug;

  // Request the audience for a list of posts id
  const loadAudience = useCallback(
    async (resourceIds: string[]) => {
      if (resourceIds.length > 0) {
        // Load views counter and reactions summary, then add them to the store.
        const [counters, summary] = await Promise.all([
          loadPostsViewsCounter(resourceIds),
          loadPostsReactionsSummary(resourceIds),
        ]);
        addPostsViewsCounters(counters);
        addPostsReactionsSummary(summary);
      }
    },
    [addPostsViewsCounters, addPostsReactionsSummary],
  );

  const query = useInfiniteQuery(
    postsListQuery(
      blogId!,
      postPageSize,
      state || postsFilters.state,
      postsFilters.search,
      withNbComments,
      publicView,
    ),
  );

  // Wait for the end of above infinite query to load audience.
  useEffect(() => {
    const pagesNumber = query.data?.pages.length;
    if (withViews && typeof pagesNumber === 'number' && pagesNumber > 0) {
      const lastPageIds = query.data?.pages[pagesNumber - 1].map(
        (post) => post._id,
      ) as string[];
      loadAudience(lastPageIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.pages.length, publicView]);

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
    publicView,
  };
};

export const useDeleteBlog = (blogId: string) => {
  const toast = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      await odeServices.resource('blog').trashAll(
        {
          application: 'blog',
          resourceIds: [blogId],
          folderIds: [],
          resourceType: 'blog',
        },
        true,
      ),
    onSuccess: () => {
      toast.success(t('explorer.trash.title'));
      // Invalidate all queries for this blog.
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all(blogId) });
    },
  });
};

export const usePostsViewsCounters = (resourceIds: string[]) => {
  const query = useQuery(postsViewsCountersQuery(resourceIds));

  return {
    counters: query.data,
    query,
  };
};
