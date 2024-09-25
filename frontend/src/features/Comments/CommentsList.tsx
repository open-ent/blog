import { useId, useState } from 'react';

import { Content } from '@edifice-ui/editor';
import { EmptyScreen, usePaths } from '@edifice-ui/react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { CommentCard } from '~/components/CommentCard/CommentCard';
import ConfirmModal from '~/components/ConfirmModal/ConfirmModal';
import { Comment } from '~/models/comment';
import { useComments } from '../../hooks/useComments';

export interface CommentsListProps {
  comments: Comment[];
}

export const CommentsList = ({ comments }: CommentsListProps) => {
  const [imagePath] = usePaths();
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const deleteModalId = useId();

  const { t } = useTranslation('blog');
  const { blogId, postId } = useParams();
  const { canCreate, canEdit, canRemove, update, remove } = useComments(
    blogId!,
    postId!,
  );

  if (!blogId || !postId || (!canCreate && comments.length <= 0)) return null;

  const handlePublishClick = (comment: Comment, newContent: Content) => {
    comment.comment = newContent as string;
    update(comment);
  };

  const handleRemoveClick = (comment: Comment) => {
    setCommentToDelete(comment);
  };

  const handleRemoveConfirmSuccess = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    commentToDelete && remove(commentToDelete.id);
    setCommentToDelete(null);
  };

  return comments.length ? (
    <>
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          className="mt-16"
          author={comment.author}
          content={comment.comment}
          mode="read"
          created={comment.modified ?? comment.created}
          onPublish={
            canEdit(comment)
              ? (newContent) => handlePublishClick(comment, newContent)
              : undefined
          }
          onRemove={
            canRemove(comment) ? () => handleRemoveClick(comment) : undefined
          }
        />
      ))}
      {commentToDelete !== null && (
        <ConfirmModal
          id={deleteModalId}
          isOpen={commentToDelete !== null}
          header={<></>}
          body={<p className="body">{t('confirm.remove.comment')}</p>}
          onSuccess={handleRemoveConfirmSuccess}
          onCancel={() => setCommentToDelete(null)}
        />
      )}
    </>
  ) : (
    <div className="m-auto mt-24">
      <EmptyScreen
        imageSrc={`${imagePath}/emptyscreen/illu-pad.svg`}
        text={t('blog.comment.emptyscreen.text')}
      />
    </div>
  );
};
