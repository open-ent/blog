import { AppHeader, Breadcrumb } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { blogQuery } from "~/services/queries";

// import { useBlog } from "~/store";

export const BlogHeader = () => {
  const params = useParams();
  const { data: blog } = useQuery(blogQuery(params.blogId as string));

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
        name={blog?.title}
      />
    </AppHeader>
  );
};
