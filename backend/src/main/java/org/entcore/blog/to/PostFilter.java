package org.entcore.blog.to;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.entcore.blog.services.PostService;

public class PostFilter {
  /** Id of the blog which includes the desired post. */
  private final String blogId;
  /** Id of the desired post. */
  private final String postId;
  /** {@code true} if we want the content of the post to be returned as-is (i.e. without TipTap conversion). */
  private final boolean originalFormat;
  /** State that the post must have. */
  private final PostService.StateType state;


  public String getBlogId() {
    return blogId;
  }

  public String getPostId() {
    return postId;
  }

  public boolean isOriginalFormat() {
    return originalFormat;
  }

  public PostService.StateType getState() {
    return state;
  }

  /**
   * @param blogId Id of the blog which includes the desired post
   * @param postId Id of the desired post
   * @param state State that the post must have
   * @param originalFormat {@code true} if we want the content of the post to be returned as it was last updated by the user (i.e. without TipTap conversion)
   */
  @JsonCreator
  public PostFilter(@JsonProperty("blogId") final String blogId,
                    @JsonProperty("postId") final String postId,
                    @JsonProperty("originalFormat") final boolean originalFormat,
                    @JsonProperty("state") final PostService.StateType state) {


    this.blogId = blogId;
    this.postId = postId;
    this.originalFormat = originalFormat;
    this.state = state;
  }
}
