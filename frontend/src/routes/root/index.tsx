import { Layout, LoadingScreen, useEdificeClient } from '@edifice.io/react';
import { Outlet } from 'react-router-dom';

import { redirectBlogHashLocation } from '~/utils/redirectBlogHashLocation';

/** Check old format URL and redirect if needed */
export const loader = async () => {
  return redirectBlogHashLocation();
};

export const Root = () => {
  const { init } = useEdificeClient();

  if (!init) return <LoadingScreen position={false} />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default Root;
