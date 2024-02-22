import { useEffect } from "react";

import { Button, EmptyScreen, usePaths } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { useActionDefinitions } from "../ActionBar/useActionDefinitions";
import { BlogPostCard } from "~/components/BlogPostCard/BlogPostCard";
import usePostsFilter from "~/hooks/usePostsFilter";
import { PostState } from "~/models/post";
import { useBlogCounter, usePostsList } from "~/services/queries";
import { useSidebarHighlightedPost } from "~/store";

const BlogPostList = () => {
  const { t } = useTranslation("blog");
  const [imagePath] = usePaths();

  const {
    posts,
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList();
  const sidebarHighlightedPost = useSidebarHighlightedPost();
  const { postsFilters } = usePostsFilter();
  const { creator, manager } = useActionDefinitions([]);
  const { counters } = useBlogCounter();

  useEffect(() => {
    if (sidebarHighlightedPost) {
      // Scroll to the selected post
      const selectedPost = document.querySelector(".card.is-selected");
      selectedPost?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [sidebarHighlightedPost]);

  const emptyScreenTitle = (): string => {
    if (postsFilters.search) {
      return t("post.search.internal.empty");
    }
    if (counters?.countAll === 0) {
      return t("blog.empty");
    }
    if (postsFilters.state === PostState.DRAFT) {
      return t("post.state.draft.empty");
    }
    if (postsFilters.state === PostState.SUBMITTED) {
      if (creator || manager) {
        return t("post.state.submitted.contrib.empty");
      }
      return t("post.state.submitted.empty");
    }
    if (postsFilters.state === PostState.PUBLISHED) {
      return t("post.state.published.empty");
    }
    return "";
  };

  return (
    <div className="d-flex flex-column gap-24 flex-fill">
      {posts?.length === 0 && isFetching === false && (
        <div className="m-auto">
          <EmptyScreen
            imageSrc={`${imagePath}/emptyscreen/illu-blog.svg`}
            title={emptyScreenTitle()}
          />
        </div>
      )}
      {posts?.map((post) => <BlogPostCard key={post._id} post={post} />)}
      {hasNextPage && (
        <div className="d-flex justify-content-center">
          <Button
            color="tertiary"
            variant="ghost"
            isLoading={isFetching}
            onClick={() => fetchNextPage()}
          >
            {t("post.see.more")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogPostList;
