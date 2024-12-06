import { useRef, useState } from 'react';

import { Button, FormControl, Input, Label } from '@edifice.io/react';
import { Editor, EditorRef } from '@edifice.io/react/editor';
import { IconSave, IconSend } from '@edifice.io/react/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ButtonGroup } from '~/components/ButtonGroup/ButtonGroup';
import { TTITLE_LENGTH_MAX } from '~/config/init-config';
import { useBlog, useCreatePost, usePublishPost } from '~/services/queries';
import { isEmptyEditorContent } from '~/utils/EditorHasContent';
import { useActionDefinitions } from '../ActionBar/useActionDefinitions';

export interface CreatePostProps {
  blogId: string;
}

export const CreatePost = ({ blogId }: CreatePostProps) => {
  const { blog } = useBlog(blogId);
  const editorRef = useRef<EditorRef>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [isEmptyTitle, setIsEmptyTitle] = useState<string>('');
  const [isEmptyContent, setIsEmptyContent] = useState<boolean>(false);
  const { t } = useTranslation('blog');

  const navigate = useNavigate();

  const { mustSubmit, getDefaultPublishKeyword } = useActionDefinitions([]);
  const createMutation = useCreatePost(blogId);
  const publishMutation = usePublishPost(blogId);

  if (!blog) return null;

  const disableButtons = createMutation.isPending || publishMutation.isPending;

  const create = async () => {
    const content = editorRef.current?.getContent('html') as string;
    const title = titleRef.current?.value ?? '';
    if (!content) return;
    return await createMutation.mutateAsync({ title, content });
  };

  const handleCancelClick = () => {
    navigate(-1);
  };

  const handleSaveClick = async () => {
    if ((blogId && titleRef.current?.value.length !== 0) || !isEmptyContent) {
      const post = await create();
      if (post) navigate(`/id/${blogId}/post/${post?._id}`);
    }
  };

  const handlePublishClick = async () => {
    if (blogId && titleRef.current?.value.length !== 0 && !isEmptyContent) {
      const post = await create();
      if (post) {
        await publishMutation.mutate({
          post,
          publishWith: getDefaultPublishKeyword(post.author.userId),
          fromEditor: true,
        });
        navigate(`/id/${blogId}/post/${post?._id}`);
      }
    }
  };

  const handleContentChange = ({ editor }: { editor: any }) => {
    const content = editor?.getJSON();
    const emptyContent = isEmptyEditorContent(content);
    setIsEmptyContent(emptyContent);
  };

  return (
    <div className="post-container mt-32">
      <FormControl id="postTitle" isRequired className="mx-md-16">
        <Label>{t('blog.post.title-helper')}</Label>
        <Input
          ref={titleRef}
          type="text"
          size="md"
          placeholder={t('post.title.placeholder')}
          maxLength={TTITLE_LENGTH_MAX}
          onChange={(e) => setIsEmptyTitle(e.target.value)}
        ></Input>
      </FormControl>
      <FormControl id="postContent" className="mt-16 mx-md-16">
        <Label>{t('blog.post.content-helper')}</Label>
      </FormControl>
      <div className="mx-md-16 post-content-editor">
        <Editor
          id="postContent"
          ref={editorRef}
          content=""
          mode="edit"
          visibility={blog?.visibility === 'PUBLIC' ? 'public' : 'protected'}
          onContentChange={handleContentChange}
        />
      </div>
      <ButtonGroup className="gap-8 mt-16 mx-md-16" variant="reverse">
        <Button type="button" variant="ghost" onClick={handleCancelClick}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<IconSave />}
          disabled={
            disableButtons || (isEmptyContent && isEmptyTitle.length == 0)
          }
          onClick={handleSaveClick}
        >
          {t('draft.save')}
        </Button>
        <Button
          type="button"
          leftIcon={<IconSend />}
          disabled={
            isEmptyTitle.trim().length == 0 || isEmptyContent || disableButtons
          }
          onClick={handlePublishClick}
        >
          {mustSubmit ? t('blog.submitPost') : t('blog.publish')}
        </Button>
      </ButtonGroup>
    </div>
  );
};
