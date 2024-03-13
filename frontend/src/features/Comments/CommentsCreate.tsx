import { Content } from "@edifice-ui/editor";
import { useUser } from "@edifice-ui/react";
import clsx from "clsx";
import { UserProfile } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import { CommentCard } from "~/components/CommentCard/CommentCard";
import { useComments } from "~/hooks/useComments";
import { Comment } from "~/models/comment";

export interface CommentsCreateProps {
  comments: Comment[];
}

export const CommentsCreate = ({ comments }: CommentsCreateProps) => {
  const { user } = useUser();
  const { blogId, postId } = useParams();
  const { canCreate, create } = useComments(blogId!, postId!);

  if (!user?.userId || !blogId || !postId || !canCreate) return <></>;

  const cssClasses = clsx("mt-16", { "bg-gray-200": comments.length > 0 });

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
      className={cssClasses}
      author={userAsAuthor}
      mode="edit"
      onPublish={handlePublish}
    />
  );
};
