package org.entcore.blog;

import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.explorer.IExplorerPluginClient;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;
import org.entcore.test.TestHelper;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.testcontainers.containers.MongoDBContainer;

import java.util.*;

@RunWith(VertxUnitRunner.class)
public class BlogExplorerPluginClientTest {
    @ClassRule
    public static final ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    private static final TestHelper test = explorerTest.getTestHelper();

    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static final String application = BlogExplorerPlugin.APPLICATION;
    static final String resourceType = BlogExplorerPlugin.TYPE;
    static BlogService blogService;
    static PostService postService;
    static BlogExplorerPlugin blogPlugin;
    static PostExplorerPlugin postPlugin;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos admin = test.directory().generateUser("admin");
    static final UserInfos user = test.directory().generateUser("user1");
    static final UserInfos user2 = test.directory().generateUser("user2");
    static MongoDb mongo;
    static MongoClient mongoClient;
    static IExplorerPluginClient client;

    @BeforeClass
    public static void setUp(TestContext context) {
        user.setLogin("user1");
        user2.setLogin("user2");
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        mongo = MongoDb.getInstance();
        final int POST_SEARCH_WORD = 4;
        final int BLOG_PAGING = 30;
        final int BLOG_SEARCH_WORD = 4;
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        mongoClient = test.database().createMongoClient(mongoDBContainer);
        blogPlugin = new BlogExplorerPlugin(communication, mongoClient);
        postPlugin = blogPlugin.postPlugin();
        postService = new DefaultPostService(mongo, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin);
        blogService = new DefaultBlogService(mongo, postService, BLOG_PAGING, BLOG_SEARCH_WORD, blogPlugin);
        blogPlugin.start();
        client = IExplorerPluginClient.withBus(test.vertx(), application, resourceType);
    }

    @AfterClass
    public static void tearDown(TestContext context) {
        blogPlugin.stop();
    }

    static JsonObject createBlog(final String name, final UserInfos user) {
        final JsonObject blog = new JsonObject().put("thumbnail", "thumb_" + name).put("comment-type", "IMMEDIATE");
        blog.put("description", "desc_" + name).put("title", "title_" + name);
        blog.put("created", MongoDb.nowISO()).put("modified", MongoDb.nowISO());
        blog.put("author", new JsonObject().put("userId", user.getUserId()).put("username", user.getUsername()).put("login", user.getLogin()));
        blog.put("publish-type", "IMMEDIATE").put("shared", new JsonArray()).put("visibility", "OWNER");
        return blog;
    }

    static Future<JsonObject> saveBlog(final String name, final UserInfos user) {
        final JsonObject json = createBlog(name, user);
        final Promise<String> promise = Promise.promise();
        mongoClient.insert(Blog.BLOGS_COLLECTION, json, promise);
        return promise.future().map(e -> {
            json.put("_id", e);
            return json;
        });
    }

    static JsonObject createPost(final String blogId, final String name, final UserInfos user) {
        final JsonObject blogRef = new JsonObject().put("$ref", "blogs").put("$id", blogId);
        final JsonObject blog = new JsonObject();
        blog.put("content", "desc_" + name).put("title", "title_" + name);
        blog.put("created", MongoDb.nowISO()).put("modified", MongoDb.nowISO());
        blog.put("author", new JsonObject().put("userId", user.getUserId()).put("username", user.getUsername()).put("login", user.getLogin()));
        blog.put("state", "PUBLISHED");
        blog.put("blog", blogRef);
        return blog;
    }

    static Future<JsonObject> savePost(final String blogId, final String name, final UserInfos user) {
        final JsonObject json = createPost(blogId, name, user);
        final Promise<String> promise = Promise.promise();
        mongoClient.insert(Blog.POSTS_COLLECTION, json, promise);
        return promise.future().map(e -> {
            json.put("_id", e);
            return json;
        });
    }

    @Test
    public void shouldMigrateBlog(TestContext context) {
        final Async async = context.async();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch0 -> {
            context.assertEquals(0, fetch0.size());
            explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                context.assertEquals(0, fetch1.size());
                saveBlog("blog1", user).compose(blog1 -> {
                    final String blog1Id = blog1.getString("_id");
                    return savePost(blog1Id, "post1", user).compose(post1 -> {
                        return saveBlog("blog2", user2).compose(blog2 -> {
                            return client.getForIndexation(admin, Optional.empty(), Optional.empty()).onComplete(context.asyncAssertSuccess(indexation -> {
                                context.assertEquals(2, indexation.nbBatch);
                                context.assertEquals(2, indexation.nbMessage);
                                explorerTest.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(pending -> {
                                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch2 -> {
                                            explorerTest.fetch(user2, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch3 -> {
                                                {
                                                    System.out.println(fetch2);
                                                    context.assertEquals(1, fetch2.size());
                                                    final JsonObject model = fetch2.getJsonObject(0);
                                                    context.assertEquals(blog1.getString("title"), model.getString("name"));
                                                    context.assertEquals(user.getUserId(), model.getString("creatorId"));
                                                    context.assertEquals(user.getUserId(), model.getString("updaterId"));
                                                    context.assertEquals(application, model.getString("application"));
                                                    context.assertEquals(resourceType, model.getString("resourceType"));
                                                    context.assertEquals(blog1.getString("description"), model.getString("contentHtml"));
                                                    context.assertEquals(user.getUsername(), model.getString("creatorName"));
                                                    context.assertEquals(user.getUsername(), model.getString("updaterName"));
                                                    context.assertFalse(model.getBoolean("public"));
                                                    context.assertFalse(model.getBoolean("trashed"));
                                                    context.assertNotNull(model.getNumber("createdAt"));
                                                    context.assertNotNull(model.getNumber("updatedAt"));
                                                    context.assertNotNull(model.getString("entId"));
                                                }
                                                {
                                                    System.out.println(fetch3);
                                                    context.assertEquals(1, fetch3.size());
                                                    final JsonObject model = fetch3.getJsonObject(0);
                                                    context.assertEquals(blog2.getString("title"), model.getString("name"));
                                                    context.assertEquals(user2.getUserId(), model.getString("creatorId"));
                                                    context.assertEquals(user2.getUserId(), model.getString("updaterId"));
                                                    context.assertEquals(application, model.getString("application"));
                                                    context.assertEquals(resourceType, model.getString("resourceType"));
                                                    context.assertEquals(blog2.getString("description"), model.getString("contentHtml"));
                                                    context.assertEquals(user2.getUsername(), model.getString("creatorName"));
                                                    context.assertEquals(user2.getUsername(), model.getString("updaterName"));
                                                    context.assertFalse(model.getBoolean("public"));
                                                    context.assertFalse(model.getBoolean("trashed"));
                                                    context.assertNotNull(model.getNumber("createdAt"));
                                                    context.assertNotNull(model.getNumber("updatedAt"));
                                                    context.assertNotNull(model.getString("entId"));
                                                }
                                            }));
                                        }));
                                    }));
                                }));
                            }));
                        });
                    });
                }).onComplete(context.asyncAssertSuccess(e -> {
                    async.complete();
                }));
            }));
        }));
    }
}
