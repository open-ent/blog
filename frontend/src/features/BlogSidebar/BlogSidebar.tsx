import { RafterDown } from "@edifice-ui/icons";
import { AppIcon, IconButton, Image, useOdeClient } from "@edifice-ui/react";

import { SummaryList } from "~/components/SummaryList/SummaryList";
import { useBlog, usePostsList } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

const BlogSidebar = () => {
  const { blog } = useBlog();
  const { posts } = usePostsList();
  const { currentApp } = useOdeClient();
  const { setSidebarPostSelected } = useStoreUpdaters();

  const handleOnClick = (id: string) => {
    setSidebarPostSelected(posts?.find((post) => post._id === id));
  };

  const {
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList();

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
        <AppIcon app={currentApp} iconFit="ratio" size="80" variant="rounded" />
      )}
      {posts && (
        <div className="mt-8 py-8 blog-summary-list">
          <SummaryList
            list={posts.map((post) => ({
              id: post._id,
              title: post.title,
              date: post.modified?.$date,
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
