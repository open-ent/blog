import { Image } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { blogQuery } from "~/services/queries";

const BlogContent = () => {
  const params = useParams();
  const { data: blog } = useQuery(blogQuery(params.blogId as string));

  // TODO load default image if no thumbnail
  if (!blog) return <div>Default image here</div>;
  return <Image src={blog.thumbnail} alt={blog.title} />;
};

export default BlogContent;
