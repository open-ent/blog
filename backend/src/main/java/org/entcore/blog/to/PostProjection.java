package org.entcore.blog.to;

public class PostProjection {

  private final boolean withContent;
  private final boolean withComments;
  private final boolean withNbComments;


  public PostProjection(boolean withContent, boolean withComments, boolean withNbComments) {
    this.withContent = withContent;
    this.withComments = withComments;
    this.withNbComments = withNbComments;
  }

  public boolean isWithContent() {
    return withContent;
  }

  public boolean isWithComments() {
    return withComments;
  }

  public boolean isWithNbComments() {
    return withNbComments;
  }
}