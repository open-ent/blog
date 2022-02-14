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
import org.entcore.common.explorer.ExplorerPluginFactory;
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
        return new JsonObject().put("title", name).put("description", name).put("slug", name).put("thumbnail", name);
    }

    @Test
    public void shouldCreateBlog(TestContext context) {
        final JsonObject b1 = resource("blog1");
        final UserInfos user = test.directory().generateUser("usermove");
        final Async async = context.async();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch0 -> {
            context.assertEquals(0, fetch0.size());
            blogService.create(b1, user, false, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(r -> {
                plugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3->{
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            async.complete();
                        }));
                    }));
                }));
            })));
        }));
    }
}
