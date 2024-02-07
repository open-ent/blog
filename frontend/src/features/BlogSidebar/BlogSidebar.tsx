import { AppIcon, Image, useOdeClient } from "@edifice-ui/react";

import { SummaryList } from "~/components/SummaryList/SummaryList";
import { useBlog, useMetadataPostsList } from "~/services/queries";

const BlogSidebar = () => {
  const { blog } = useBlog();
  const { posts } = useMetadataPostsList();
  const { currentApp } = useOdeClient();

  return (
    <div className=" d-none d-lg-block col-3 py-16 pe-16 border-end">
      {blog?.thumbnail ? (
        <Image
          src={blog.thumbnail}
          alt={blog.title}
          objectFit="cover"
          className="h-auto w-100 rounded"
        />
      ) : (
        <AppIcon app={currentApp} iconFit="ratio" size="80" variant="rounded" />
      )}
      {posts && (
        <SummaryList
          list={posts.map((post) => ({
            id: post._id,
            title: post.title,
            date: post.modified?.$date,
          }))}
        />
      )}
    </div>
  );
};

export default BlogSidebar;
