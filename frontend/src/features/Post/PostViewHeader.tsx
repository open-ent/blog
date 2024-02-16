import { AppHeader, Breadcrumb } from "@edifice-ui/react";

import { usePostContext } from "./PostProvider";

export const PostViewHeader = () => {
  const { post } = usePostContext();
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
        name={post.title}
      />
    </AppHeader>
  );
};
