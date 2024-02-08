import { AppHeader, Breadcrumb } from "@edifice-ui/react";

import { Post } from "~/models/post";

type PostHeaderProps = { post: Post };

export const PostHeader = ({ post }: PostHeaderProps) => {
  return (
    <AppHeader>
      <Breadcrumb
        app={{
          address: "/blog",
          display: false,
          displayName: "Blog",
          icon: "",
          isExternal: false,
          name: "",
          scope: [],
        }}
        name={post?.title}
      />
    </AppHeader>
  );
};
