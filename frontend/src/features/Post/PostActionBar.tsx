import { Suspense, lazy, useState } from 'react';

import { Button, IconButton, useToggle } from '@edifice.io/react';
import { IconEdit, IconOptions, IconSend } from '@edifice.io/react/icons';
import { useTranslation } from 'react-i18next';

import { Post, PostState } from '~/models/post';
import { ActionBarContainer } from '../ActionBar/ActionBarContainer';
import { PostActions } from '../ActionBar/usePostActions';

const ConfirmModal = lazy(
  async () => await import('~/components/ConfirmModal/ConfirmModal'),
);

export interface PostActionBarProps {
  post: Post;
  postActions?: PostActions;
  isSpeeching?: boolean;
  onPrint?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  onTts?: () => void;
}

export const PostActionBar = ({
  post,
  postActions,
  onPrint,
  onEdit,
  onPublish,
  onDelete,
  onTts,
}: PostActionBarProps) => {
  const { t } = useTranslation('blog');
  const { t: common_t } = useTranslation('common');
  const { mustSubmit, canPublish, isMutating, emptyContent, readOnly } =
    postActions || {};

  const [isBarOpen, toggleBar] = useToggle();

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const shouldBeSubmitted =
    mustSubmit && post.state === PostState.DRAFT && canPublish;
  const shouldBePublished =
    !mustSubmit && post.state !== PostState.PUBLISHED && canPublish;

  // Is `edit` the main action ?
  const isMainActionEdit = !shouldBePublished;

  return (
    <>
      {isMainActionEdit ? (
        <Button leftIcon={<IconEdit />} disabled={isMutating} onClick={onEdit}>
          {common_t('edit')}
        </Button>
      ) : (
        <Button
          leftIcon={<IconSend />}
          disabled={isMutating || emptyContent || post.title.length == 0}
          onClick={onPublish}
        >
          {t('blog.publish')}
        </Button>
      )}

      <IconButton
        variant="outline"
        icon={<IconOptions />}
        aria-label={common_t('tiptap.tooltip.plus')}
        onClick={toggleBar}
      />

      <ActionBarContainer visible={isBarOpen}>
        {shouldBeSubmitted && (
          <Button
            type="button"
            variant="filled"
            disabled={isMutating}
            onClick={onPublish}
          >
            {t('blog.submitPost')}
          </Button>
        )}
        {isMainActionEdit ? (
          shouldBePublished && (
            <Button
              type="button"
              variant="filled"
              disabled={isMutating || emptyContent || post.title.length == 0}
              onClick={onPublish}
            >
              {t('blog.publish')}
            </Button>
          )
        ) : (
          <Button
            type="button"
            variant="filled"
            disabled={isMutating}
            onClick={onEdit}
          >
            {common_t('edit')}
          </Button>
        )}
        <Button
          type="button"
          color="primary"
          variant="filled"
          onClick={onPrint}
        >
          {t('blog.print')}
        </Button>
        <Button color="primary" variant="filled" onClick={onTts}>
          {common_t('tiptap.toolbar.tts')}
        </Button>

        {!readOnly && (
          <Button
            type="button"
            color="primary"
            variant="filled"
            disabled={isMutating}
            onClick={() => setConfirmDeleteModal(true)}
          >
            {t('blog.delete.post')}
          </Button>
        )}
      </ActionBarContainer>

      <Suspense>
        {confirmDeleteModal && (
          <ConfirmModal
            id="confirmDeleteModal"
            isOpen={confirmDeleteModal}
            header={<>{t('blog.delete.post')}</>}
            body={<p className="body">{t('confirm.remove.post')}</p>}
            onSuccess={onDelete}
            onCancel={() => setConfirmDeleteModal(false)}
          />
        )}
      </Suspense>
    </>
  );
};
