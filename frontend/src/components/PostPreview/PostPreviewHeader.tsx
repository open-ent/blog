import { Avatar, Badge } from '@edifice-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useActionDefinitions } from '~/features/ActionBar/useActionDefinitions';
import { PostDate } from '~/features/Post/PostDate';
import { Post, PostState } from '~/models/post';
import { getAvatarURL } from '~/utils/PostUtils';

export type PostPreviewHeaderProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const PostPreviewHeader = ({ post }: PostPreviewHeaderProps) => {
  const { t } = useTranslation('blog');
  const navigate = useNavigate();

  const { contrib, manager, creator } = useActionDefinitions([]);
  const handleClickGoDetail = () => {
    navigate(`./post/${post?._id}`);
  };

  return (
    <div
      className="d-flex gap-12"
      onClick={handleClickGoDetail}
      tabIndex={-1}
      role="button"
    >
      <div className="blog-post-user-image">
        <Avatar
          alt={t('blog.author.avatar')}
          size="md"
          src={getAvatarURL(post.author.userId)}
          variant="circle"
        />
      </div>
      <div className="d-flex flex-column gap-2">
        <div className="d-flex align-items-center">
          <h4 className="post-preview-title">{post.title}</h4>
          {post.state === PostState.DRAFT &&
            (creator || manager || contrib) && (
              <Badge
                className="ms-8"
                variant={{
                  type: 'content',
                  level: 'info',
                  background: true,
                }}
              >
                {t('draft')}
              </Badge>
            )}
          {post.state === PostState.SUBMITTED && (
            <Badge
              className="blog-post-badge ms-8"
              variant={{
                type: 'content',
                level: 'warning',
                background: true,
              }}
            >
              {t('blog.filters.submitted')}
            </Badge>
          )}
        </div>
        <div className="text-gray-700 small column-gap-12 d-flex flex-column flex-md-row align-items-md-center">
          <span>{post.author.username}</span>
          <PostDate post={post} shortDisplay={true}></PostDate>
        </div>
      </div>
    </div>
  );
};
