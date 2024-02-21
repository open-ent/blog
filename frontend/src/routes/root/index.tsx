import { Layout } from "@edifice-ui/react";
import { Outlet, redirect } from "react-router-dom";

import { needRedirect } from "~/utils/redirectBlogNGLocation";

/** Check old format URL and redirect if needed */
export const rootLoader = () => async () => {
  const redirectPath = needRedirect();
  if (redirectPath) {
    return redirect(redirectPath);
  }

  return;
};

export const Root = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
