import { BlogFilter } from "../BlogFilter/BlogFilter";
import BlogSidebar from "../BlogSidebar/BlogSidebar";
import { useMetadataPostsList } from "~/services/queries";

const BlogContent = () => {
  const { posts } = useMetadataPostsList();

  return (
    <div className="d-flex flex-fill">
      <BlogSidebar />
      <div className="col-9 py-16 ps-16">
        <BlogFilter />
        <h1>List of posts</h1>
        {posts?.map((post) => (
          <div key={post._id} className="pb-8">
            <div>{post.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogContent;
