import { EmptyScreen, usePaths } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { CommentCard } from "~/components/CommentCard/CommentCard";
import { Comment } from "~/models/comment";

export interface CommentsListProps {
  comments: Comment[];
}

export const CommentsList = ({ comments }: CommentsListProps) => {
  const [imagePath] = usePaths();
  const { t } = useTranslation("blog");

  return comments.length ? (
    <div>
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} className="mt-16" />
      ))}
    </div>
  ) : (
    <div className="m-auto">
      <EmptyScreen
        imageSrc={`${imagePath}/emptyscreen/illu-pad.svg`}
        text={t("blog.comment.emptyscreen.text")}
      />
    </div>
  );
};
