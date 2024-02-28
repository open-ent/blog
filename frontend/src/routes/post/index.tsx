import { QueryClient, useQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

import { postContentActions } from "~/config/postContentActions";
import { PostContent } from "~/features/Post/PostContent";
import { PostHeader } from "~/features/Post/PostHeader";
import { PostMetadata } from "~/models/post";
import { loadPostMetadata } from "~/services/api";
import { availableActionsQuery, postQuery } from "~/services/queries";

/** Load a blog post content */
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const { blogId, postId } = params;
    // Prefetch some data, if not done already
    const actions = availableActionsQuery(postContentActions);
    await queryClient.fetchQuery(actions);

    if (blogId && postId) {
      return await loadPostMetadata(blogId, postId);
    }

    return null;
  };

export function Component() {
  const { blogId } = useParams();
  const postMetadata = useLoaderData() as PostMetadata; // see loader above
  const query = useQuery(postQuery(blogId!, postMetadata));

  if (!blogId || !query.data) {
    return <></>;
  }

  return (
    <>
      <PostHeader />
      <PostContent blogId={blogId} post={query.data} />
    </>
  );
}
