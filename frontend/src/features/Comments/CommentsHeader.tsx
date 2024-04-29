import { useTranslation } from "react-i18next";

import { Comment } from "~/models/comment";

export interface CommentsHeaderProps {
  comments: Comment[];
}

export const CommentsHeader = ({ comments }: CommentsHeaderProps) => {
  const { t } = useTranslation("blog");

  return (
    <div className="d-flex justify-content-between align-items-center pt-24 pb-8">
      <h3>
        {comments.length} {t("blog.comments")}
      </h3>
    </div>
  );
};
