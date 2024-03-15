import { Content } from "@edifice-ui/editor";
import { useUser } from "@edifice-ui/react";
import { UserProfile } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import { CommentCard } from "~/components/CommentCard/CommentCard";
import { useComments } from "~/hooks/useComments";

export const CommentsCreate = () => {
  const { user } = useUser();
  const { blogId, postId } = useParams();
  const { canCreate, create } = useComments(blogId!, postId!);

  if (!user?.userId || !blogId || !postId || !canCreate) return <></>;

  const userAsAuthor = {
    userId: user?.userId,
    username: user?.username,
    profiles: user?.type as unknown as UserProfile,
  };

  const handlePublish = (content: Content) => {
    create(content as string);
  };

  return (
    <CommentCard
      className="mt-16"
      author={userAsAuthor}
      mode="edit"
      onPublish={handlePublish}
    />
  );
};
