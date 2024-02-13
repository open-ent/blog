import { LoadingScreen, Layout } from "@edifice-ui/react";
import { Outlet } from "react-router-dom";

import { useBlogRedirect } from "~/hooks/useBlogRedirect";

function Root() {
  const isLoading = useBlogRedirect();

  if (isLoading) return <LoadingScreen position={false} />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default Root;
