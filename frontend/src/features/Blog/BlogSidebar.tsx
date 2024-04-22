import { RafterDown } from "@edifice-ui/icons";
import { AppIcon, IconButton, Image, useOdeClient } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { SummaryList } from "~/components/SummaryList/SummaryList";
import { PostState } from "~/models/post";
import { useBlog, usePostsList } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

const BlogSidebar = () => {
  const { t } = useTranslation("blog");

  const { blog, publicView } = useBlog();

  const {
    posts,
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList(
    blog?._id,
    publicView ? PostState.PUBLISHED : undefined,
    publicView ? false : undefined,
  );

  const { currentApp } = useOdeClient();

  const { setSidebarHighlightedPost } = useStoreUpdaters();

  const handleOnClick = (id: string) => {
    setSidebarHighlightedPost(posts?.find((post) => post._id === id));
    setTimeout(() => {
      setSidebarHighlightedPost();
    }, 4000);
  };

  return (
    <div className="d-none d-lg-block col-3 py-16 pe-16 border-end">
      {blog?.thumbnail ? (
        <Image
          src={blog.thumbnail}
          alt={blog.title}
          objectFit="cover"
          className="w-100 rounded"
          ratio="16"
        />
      ) : (
        <div className="w-100 rounded color-app-blog d-flex justify-content-center align-items-center ratio ratio-16x9">
          <AppIcon
            app={currentApp}
            iconFit="ratio"
            variant="rounded"
            className="w-100 h-100"
          />
        </div>
      )}
      {posts && (
        <div className="mt-8 py-8 blog-summary-list">
          <SummaryList
            list={posts.map((post) => ({
              id: post._id,
              title: post.title,
              date: post.firstPublishDate || post.modified,
            }))}
            onClick={(item) => handleOnClick(item.id)}
          />
          {hasNextPage && (
            <div className="d-flex justify-content-center">
              <IconButton
                color="tertiary"
                variant="ghost"
                isLoading={isFetching}
                onClick={() => fetchNextPage()}
                aria-label={t("post.see.more")}
                icon={<RafterDown />}
              ></IconButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogSidebar;
