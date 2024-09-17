import { ArrowRight, MessageInfo } from "@edifice-ui/icons";
import { Button } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PostPreviewAudienceFooter } from "./PostPreviewAudienceFooter";
import { PostPreviewReactionFooter } from "./PostPreviewReactionFooter";
import { Post } from "~/models/post";
import { useBlog } from "~/services/queries";

export type PostPreviewFooterProps = {
  /**
   * Post to display
   */
  post: Post;
};

export const PostPreviewFooter = ({ post }: PostPreviewFooterProps) => {
  const { t } = useTranslation("blog");
  const navigate = useNavigate();

  const { isPublicBlog } = useBlog();

  const handleClickGoDetail = () => {
    navigate(`./post/${post?._id}`);
  };

  const showAudience = !isPublicBlog;

  return (
    <div className="pt-16">
      <div className="d-flex align-items-center pb-4">
        {showAudience && <PostPreviewAudienceFooter post={post} />}
        {post.nbComments !== undefined && (
          <div className="post-footer-element">
            <Button
              onClick={handleClickGoDetail}
              variant="ghost"
              className="text-gray-700 fw-normal py-4 px-8 btn-icon"
            >
              <span>{post.nbComments}</span>
              <MessageInfo />
            </Button>
          </div>
        )}
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <div className="pt-4">
          {showAudience && <PostPreviewReactionFooter post={post} />}
        </div>
        <Button
          variant="ghost"
          rightIcon={<ArrowRight />}
          color="secondary"
          className="align-self-end justify-self-end"
          onClick={handleClickGoDetail}
        >
          {t("blog.post.preview.readMore")}
        </Button>
      </div>
    </div>
  );
};
