package org.entcore.blog;

import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.explorer.IExplorerPlugin;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;
import org.entcore.test.TestHelper;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.testcontainers.containers.MongoDBContainer;

import java.util.HashMap;
import java.util.Map;

@RunWith(VertxUnitRunner.class)
public class BlogExplorerPluginTest {
    private static final TestHelper test = TestHelper.helper();
    @ClassRule
    public static ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static BlogService blogService;
    static IExplorerPlugin plugin;
    static final String application = BlogExplorerPlugin.APPLICATION;
    static final String resourceType = BlogExplorerPlugin.TYPE;
    static Map<String, Object> data = new HashMap<>();
    final UserInfos user = test.directory().generateUser("user1");
    final UserInfos user2 = test.directory().generateUser("user2");

    @BeforeClass
    public static void setUp(TestContext context) {
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        MongoDb mongo = MongoDb.getInstance();
        final int POST_SEARCH_WORD = 4;
        final int BLOG_PAGING = 30;
        final int BLOG_SEARCH_WORD = 4;
        final PostService postService = new DefaultPostService(mongo, POST_SEARCH_WORD, PostController.LIST_ACTION);
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        final MongoClient mongoClient = test.database().createMongoClient(mongoDBContainer);
        plugin = new BlogExplorerPlugin(communication, mongoClient);
        blogService = new DefaultBlogService(mongo, postService, BLOG_PAGING, BLOG_SEARCH_WORD, plugin);
    }

    static JsonObject resource(final String name) {
        return new JsonObject().put("title", name).put("description", "description"+name).put("slug", "slug"+name).put("thumbnail", "thumb"+name).put("comment-type", "IMMEDIATE");
    }

    @Test
    public void shouldCreateBlog(TestContext context) {
        final JsonObject b1 = resource("blog1");
        final Async async = context.async();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch0 -> {
            context.assertEquals(0, fetch0.size());
            blogService.create(b1, user, false, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(r -> {
                plugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3->{
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            final JsonObject first = fetch1.getJsonObject(0);
                            context.assertEquals(b1.getString("title"), first.getString("name"));
                            context.assertEquals(user.getUserId(), first.getString("creatorId"));
                            context.assertEquals(user.getUserId(), first.getString("updaterId"));
                            context.assertEquals(application, first.getString("application"));
                            context.assertEquals(resourceType, first.getString("resourceType"));
                            context.assertEquals(b1.getString("description"), first.getString("contentHtml"));
                            context.assertEquals(user.getUsername(), first.getString("creatorName"));
                            context.assertEquals(user.getUsername(), first.getString("updaterName"));
                            context.assertFalse(first.getBoolean("public"));
                            context.assertFalse(first.getBoolean("trashed"));
                            context.assertNotNull(first.getNumber("createdAt"));
                            context.assertNotNull(first.getNumber("updatedAt"));
                            context.assertNotNull(first.getString("entId"));
                            blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list ->{
                                context.assertEquals(1, list.size());
                                final JsonObject firstDb = list.getJsonObject(0);
                                context.assertEquals(b1.getString("title"), firstDb.getString("title"));
                                context.assertEquals(b1.getString("description"), firstDb.getString("description"));
                                context.assertEquals(b1.getString("thumbnail"), firstDb.getString("thumbnail"));
                                context.assertEquals(b1.getBoolean("trashed"), firstDb.getBoolean("trashed"));
                                context.assertEquals(first.getString("entId"), firstDb.getString("_id"));
                                context.assertNotNull(firstDb.getJsonObject("created").getNumber("$date"));
                                context.assertNotNull(firstDb.getJsonObject("modified").getNumber("$date"));
                                context.assertEquals(user.getUserId(), firstDb.getJsonObject("author").getString("userId"));
                                context.assertEquals(user.getUsername(), firstDb.getJsonObject("author").getString("username"));
                                context.assertEquals(user.getLogin(), firstDb.getJsonObject("author").getString("login"));
                                context.assertEquals(b1.getString("comment-type"), firstDb.getString("comment-type"));
                                context.assertEquals("RESTRAINT", firstDb.getString("publish-type"));
                                context.assertEquals("OWNER", firstDb.getString("visibility"));
                                async.complete();
                            })));
                        }));
                    }));
                }));
            })));
        }));
    }

    @Test
    public void shouldUpdateBlog(TestContext context) {
        final Async async = context.async();
        blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list0 -> {
            context.assertEquals(1, list0.size());
            final JsonObject model = list0.getJsonObject(0);
            final String id = model.getString("_id");
            context.assertNotNull(id);
            final JsonObject b2 = resource("blog2").put("trashed", true).put("visibility", "PUBLIC");
            blogService.update(user2, id, b2, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(update->{
                plugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            final JsonObject first = fetch1.getJsonObject(0);
                            context.assertEquals(b2.getString("title"), first.getString("name"));
                            context.assertEquals(user.getUserId(), first.getString("creatorId"));
                            context.assertEquals(user2.getUserId(), first.getString("updaterId"));
                            context.assertEquals(application, first.getString("application"));
                            context.assertEquals(resourceType, first.getString("resourceType"));
                            context.assertEquals(b2.getString("description"), first.getString("contentHtml"));
                            context.assertEquals(user.getUsername(), first.getString("creatorName"));
                            context.assertEquals(user2.getUsername(), first.getString("updaterName"));
                            context.assertTrue(first.getBoolean("public"));
                            context.assertTrue(first.getBoolean("trashed"));
                            context.assertNotNull(first.getNumber("createdAt"));
                            context.assertNotNull(first.getNumber("updatedAt"));
                            context.assertEquals(id, first.getString("entId"));blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list ->{
                                context.assertEquals(1, list.size());
                                final JsonObject firstDb = list.getJsonObject(0);
                                context.assertEquals(b2.getString("title"), firstDb.getString("title"));
                                context.assertEquals(b2.getString("description"), firstDb.getString("description"));
                                context.assertEquals(b2.getString("thumbnail"), firstDb.getString("thumbnail"));
                                context.assertEquals(b2.getBoolean("trashed"), firstDb.getBoolean("trashed"));
                                context.assertEquals(first.getString("entId"), firstDb.getString("_id"));
                                context.assertNotNull(firstDb.getJsonObject("created").getNumber("$date"));
                                context.assertNotNull(firstDb.getJsonObject("modified").getNumber("$date"));
                                context.assertEquals(user.getUserId(), firstDb.getJsonObject("author").getString("userId"));
                                context.assertEquals(user.getUsername(), firstDb.getJsonObject("author").getString("username"));
                                context.assertEquals(user.getLogin(), firstDb.getJsonObject("author").getString("login"));
                                context.assertEquals(b2.getString("comment-type"), firstDb.getString("comment-type"));
                                context.assertEquals("RESTRAINT", firstDb.getString("publish-type"));
                                context.assertEquals("PUBLIC", firstDb.getString("visibility"));
                                async.complete();
                            })));
                        }));
                    }));
                }));
            })));
        })));
    }

    @Test
    public void shouldDeleteBlog(TestContext context) {
        final Async async = context.async();
        blogService.list(user, 0, "",  test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(list -> {
            context.assertEquals(1, list.size());
            final JsonObject firstDb = list.getJsonObject(0);
            final String id = firstDb.getString("_id");
            context.assertNotNull(id);
            blogService.delete(user2, id, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(update->{
                plugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3-> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(0, fetch1.size());
                            async.complete();
                        }));
                    }));
                }));
            })));
        })));
    }

}
