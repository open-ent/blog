package org.entcore.blog;

import com.opendigitaleducation.explorer.ingest.IngestJobMetricsRecorderFactory;
import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.security.SecuredAction;
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
import org.entcore.blog.services.impl.BlogRepositoryEvents;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.explorer.impl.ExplorerRepositoryEvents;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;
import org.entcore.test.TestHelper;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;

import java.util.*;

@RunWith(VertxUnitRunner.class)
public class BlogRepositoryEventTest {
    static final String RIGHT = "org-entcore-blog-controllers-BlogController|get";
    private static final TestHelper test = TestHelper.helper();
    @ClassRule
    public static Neo4jContainer<?> neo4jContainer = test.database().createNeo4jContainer();
    @ClassRule
    public static ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static BlogService blogService;
    static PostService postService;
    static BlogExplorerPlugin blogPlugin;
    static PostExplorerPlugin postPlugin;
    static ShareService shareService;
    static final String application = BlogExplorerPlugin.APPLICATION;
    static final String resourceType = BlogExplorerPlugin.TYPE;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos user = test.directory().generateUser("user1");
    static final UserInfos user2 = test.directory().generateUser("user2");
    static ExplorerRepositoryEvents repositoryEvents;

    @BeforeClass
    public static void setUp(TestContext context) throws Exception {
        IngestJobMetricsRecorderFactory.init(test.vertx(), new JsonObject());
        test.database().initNeo4j(context, neo4jContainer);
        user.setLogin("user1");
        user2.setLogin("user2");
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        MongoDb mongo = MongoDb.getInstance();
        final int POST_SEARCH_WORD = 4;
        final int BLOG_PAGING = 30;
        final int BLOG_SEARCH_WORD = 4;
        final Map<String, SecuredAction> securedActions = test.share().getSecuredActions(context);
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        final MongoClient mongoClient = test.database().createMongoClient(mongoDBContainer);
        blogPlugin = new BlogExplorerPlugin(communication, mongoClient, securedActions);
        postPlugin = blogPlugin.postPlugin();
        postService = new DefaultPostService(mongo, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin);
        blogService = new DefaultBlogService(mongo, postService, BLOG_PAGING, BLOG_SEARCH_WORD, blogPlugin);
        shareService = blogPlugin.createMongoShareService(Blog.BLOGS_COLLECTION, securedActions, new HashMap<>());
        repositoryEvents = new ExplorerRepositoryEvents(blogPlugin, new BlogRepositoryEvents(test.vertx()));
    }

    static JsonObject createBlog(final String name) {
        return new JsonObject().put("title", name).put("description", "description" + name).put("slug", "slug" + name).put("thumbnail", "thumb" + name).put("comment-type", "IMMEDIATE");
    }

    static JsonObject createPost(final String name) {
        return new JsonObject().put("title", name).put("content", "description" + name).put("state", "PUBLISHED");
    }

    /**
     * <b>This test assert that a blog is upserted in OpenSearch when a resource is imported through RepositoryEvent</b>
     * <ul>
     *     <li>Import a blog for user</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Assert that the blog has been created</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void shouldUpsertOnImport(TestContext context) {
        final Async async = context.async();
        final String importPath = this.getClass().getClassLoader().getResource("import/").getPath();
        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch0 -> {
            context.assertEquals(0, fetch0.size());
            repositoryEvents.importResources("id", user.getUserId(), "user1", "user1", importPath, "fr", "host", false, onFinish -> {
                blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        explorerTest.fetch(user, application, explorerTest.createSearch()).onComplete(context.asyncAssertSuccess(fetch1 -> {
                            context.assertEquals(1, fetch1.size());
                            async.complete();
                        }));
                    }));
                }));
            });
        }));
    }

    /**
     * <b>This test assert that a blog is deleted in OpenSearch when the owner is deleted through RepositoryEvent</b>
     * <ul>
     *     <li>Create a blog1 for user1</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Delete owner</li>
     *     <li>Assert that blog is deleted</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void shouldDeleteOnDeleteOwner(TestContext context) {
    }

    /**
     * <b>This test assert that a blog is upsert in OpenSearch when a shared user is deleted through RepositoryEvent</b>
     * <ul>
     *     <li>Create a blog2 for user2</li>
     *     <li>Share a blog2 to user3</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Delete user3</li>
     *     <li>Assert that blog (shared) are upserted</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void shouldUpsertOnDeleteUser(TestContext context) {
    }

    /**
     * <b>This test assert that a blog is upsert in OpenSearch when a shared user is deleted through RepositoryEvent</b>
     * <ul>
     *     <li>Create a blog3 for user3</li>
     *     <li>Share a blog3 to group1</li>
     *     <li>Wait for pending index tasks</li>
     *     <li>Delete group1</li>
     *     <li>Assert that blog (shared) are upserted</li>
     * </ul>
     *
     * @param context
     */
    @Test
    public void shouldUpsertOnDeleteGroup(TestContext context) {
    }
}
