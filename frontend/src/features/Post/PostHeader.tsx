import { AppHeader, Breadcrumb, useOdeClient } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { blogQuery } from "~/services/queries";

export const PostHeader = () => {
  const params = useParams();
  const { data: blog } = useQuery(blogQuery(params.blogId as string));
  const { currentApp } = useOdeClient();

  return (
    <AppHeader>
      {currentApp && <Breadcrumb app={currentApp} name={blog?.title} />}
    </AppHeader>
  );
};
