package org.entcore.blog;

import com.opendigitaleducation.explorer.ingest.IngestJobMetricsRecorderFactory;
import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.transformer.IContentTransformerClient;
import fr.wseduc.transformer.to.ContentTransformerRequest;
import fr.wseduc.transformer.to.ContentTransformerResponse;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;
import org.entcore.test.TestHelper;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;

import java.util.HashMap;
import java.util.Map;


@RunWith(VertxUnitRunner.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class PostServiceContentTransformerTest {

    /**
     * Class to test
     */
    static PostService postService;
    private static final TestHelper test = TestHelper.helper();
    @ClassRule
    public static Neo4jContainer<?> neo4jContainer = test.database().createNeo4jContainer();
    @ClassRule
    public static ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static MongoDb mongoDb;
    static BlogExplorerPlugin blogPlugin;
    static PostExplorerPlugin postPlugin;
    static IContentTransformerClient contentTransformerClient;
    static final int POST_SEARCH_WORD = 4;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos user = test.directory().generateUser("user");

    @BeforeClass
    public static void setUp(TestContext context) throws Exception {
        IngestJobMetricsRecorderFactory.init(test.vertx(), new JsonObject());
        test.database().initNeo4j(context, neo4jContainer);
        user.setLogin("user");
        explorerTest.start(context);
        test.database().initMongo(context, mongoDBContainer);
        MongoDbConf.getInstance().setCollection("blogs");
        mongoDb = MongoDb.getInstance();
        final IExplorerPluginCommunication communication = explorerTest.getCommunication();
        final MongoClient mongoClient = test.database().createMongoClient(mongoDBContainer);
        final Map<String, SecuredAction> securedActions = test.share().getSecuredActions(context);
        blogPlugin = new BlogExplorerPlugin(communication, mongoClient, securedActions);
        postPlugin = blogPlugin.postPlugin();
        contentTransformerClient = new DummyContentTransformerClient();
        data.put("BLOGID1", "blog-id-1");

        postService = new DefaultPostService(mongoDb, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin, contentTransformerClient);
    }


    @Test
    public void step1GetTransformedPostAfterCreation(TestContext context) {

        final Async async = context.async();
        final String blogId = (String) data.get("BLOGID1");
        final JsonObject post1 = createPost("post1");
        postService.create(blogId, post1, user, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(createdPost -> {
            final String postId = createdPost.getString("_id");
            data.put("POSTID1", postId);
            context.assertNotNull(postId);
            postService.get(blogId, postId, PostService.StateType.DRAFT, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(postGet -> {
                context.assertEquals(post1.getString("content"), postGet.getString("content"));
                context.assertEquals(1, postGet.getInteger("contentVersion"));
                context.assertEquals("<p> value </p>", postGet.getJsonObject("jsonContent").getString("key"));
                async.complete();
            })));
        })));
    }




    @Test
    public void step2GetTransformedPostAfterUpdate(TestContext context) {
        final Async async = context.async();
        final String blogId = (String) data.get("BLOGID1");
        final String postId = (String) data.get("POSTID1");
        final JsonObject post2 = createPost("post2");
        postService.update(postId, post2, user, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(updatedPost -> {
            context.assertNotNull(postId);
            postService.get(blogId, postId, PostService.StateType.DRAFT, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(postGet -> {
                context.assertEquals(post2.getString("content"), postGet.getString("content"));
                context.assertEquals(1, postGet.getInteger("contentVersion"));
                context.assertEquals("<p> value </p>", postGet.getJsonObject("jsonContent").getString("key"));
                async.complete();
            })));
        })));
    }

    static class DummyContentTransformerClient implements IContentTransformerClient {

        @Override
        public Future<ContentTransformerResponse> transform(ContentTransformerRequest contentTransformerRequest) {
            return Future.succeededFuture(new ContentTransformerResponse(1, "<p> value </p>", new JsonObject().put("key", "<p> value </p>").getMap()));
        }
    }


    static JsonObject createPost(final String name) {
        return new JsonObject().put("title", name).put("content", "description" + name).put("state", "PUBLISHED");
    }
}
