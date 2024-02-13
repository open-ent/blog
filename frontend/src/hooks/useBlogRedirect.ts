import { useEffect } from "react";

import {
  useNavigate,
  useNavigation,
  useLocation,
  matchPath,
} from "react-router-dom";

export const useBlogRedirect = () => {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();

  const ngLocation = location.hash.substring(1);

  const blog = matchPath("/view/:blogId", ngLocation);
  const post = matchPath("/detail/:blogId/:postId", ngLocation);

  const blogPath = `/id/${blog?.params.blogId}`;
  const postPath = `/id/${post?.params.blogId}/post/${post?.params.postId}`;

  const isLoading = navigation.state === "loading";

  useEffect(() => {
    if (blog) navigate(blogPath);
    if (post) navigate(postPath);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isLoading;
};
