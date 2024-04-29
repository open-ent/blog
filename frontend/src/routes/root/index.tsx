import { Layout } from "@edifice-ui/react";
import { Outlet } from "react-router-dom";

import { redirectBlogHashLocation } from "~/utils/redirectBlogHashLocation";

/** Check old format URL and redirect if needed */
export const rootLoader = async () => {
  return redirectBlogHashLocation();
};

export const Root = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
