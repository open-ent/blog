import { useEffect } from "react";

import { Button } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { BlogPostCard } from "~/components/BlogPostCard/BlogPostCard";
import { usePostsList } from "~/services/queries";
import { useSidebarHighlightedPost } from "~/store";

const BlogPostList = () => {
  const { t } = useTranslation();
  const {
    posts,
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList();
  const sidebarHighlightedPost = useSidebarHighlightedPost();

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

  return (
    <div className="d-flex flex-column gap-24">
      {posts?.map((post) => <BlogPostCard key={post._id} post={post} />)}
      {hasNextPage && (
        <div className="d-flex justify-content-center">
          <Button
            color="tertiary"
            variant="ghost"
            isLoading={isFetching}
            onClick={() => fetchNextPage()}
          >
            {t("Voir plus")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogPostList;
