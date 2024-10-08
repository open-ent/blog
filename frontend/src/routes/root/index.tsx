import { Layout, LoadingScreen, useOdeClient } from "@edifice-ui/react";
import { Outlet } from "react-router-dom";

import { redirectBlogHashLocation } from "~/utils/redirectBlogHashLocation";

/** Check old format URL and redirect if needed */
export const loader = async () => {
  return redirectBlogHashLocation();
};

export const Root = () => {
  const { init } = useOdeClient();

  if (!init) return <LoadingScreen position={false} />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default Root;
