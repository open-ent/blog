package org.entcore.blog;

import com.opendigitaleducation.explorer.ingest.IngestJobMetricsRecorderFactory;
import com.opendigitaleducation.explorer.tests.ExplorerTestHelper;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.transformer.IContentTransformerClient;
import fr.wseduc.webutils.http.HttpMethod;
import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.apache.commons.lang3.math.NumberUtils;
import org.entcore.blog.controllers.FoldersControllerExplorer;
import org.entcore.blog.controllers.PostController;
import org.entcore.blog.explorer.BlogExplorerPlugin;
import org.entcore.blog.explorer.PostExplorerPlugin;
import org.entcore.blog.services.BlogService;
import org.entcore.blog.services.PostService;
import org.entcore.blog.services.impl.DefaultBlogService;
import org.entcore.blog.services.impl.DefaultPostService;
import org.entcore.common.audience.AudienceHelper;
import org.entcore.common.editor.IContentTransformerEventRecorder;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;
import org.entcore.test.HttpTestHelper;
import org.entcore.test.TestHelper;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;

import java.util.HashMap;
import java.util.Map;

@RunWith(VertxUnitRunner.class)
public class FolderControllerExplorerTest {
    static final String RIGHT = "org-entcore-blog-controllers-BlogController|get";
    private static final TestHelper test = TestHelper.helper();
    @ClassRule
    public static Neo4jContainer<?> neo4jContainer = test.database().createNeo4jContainer();
    @ClassRule
    public static ExplorerTestHelper explorerTest = new ExplorerTestHelper(BlogExplorerPlugin.APPLICATION);
    @ClassRule
    public static MongoDBContainer mongoDBContainer = test.database().createMongoContainer().withReuse(true);
    static BlogExplorerPlugin blogPlugin;
    static BlogService blogService;
    static FoldersControllerExplorer controllerExplorer;
    static final String application = BlogExplorerPlugin.APPLICATION;
    static final String resourceType = BlogExplorerPlugin.TYPE;
    static Map<String, Object> data = new HashMap<>();
    static final UserInfos user = test.directory().generateUser("user-foldercontroller0");
    static final UserInfos user1 = test.directory().generateUser("user-foldercontroller1");
    static final UserInfos user2 = test.directory().generateUser("user-foldercontroller2");
    static final UserInfos user3 = test.directory().generateUser("user-foldercontroller3");
    static final UserInfos user4 = test.directory().generateUser("user-foldercontroller4");
    static AudienceHelper audienceHelper;

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
        final PostExplorerPlugin postPlugin = blogPlugin.postPlugin();
        audienceHelper = new AudienceHelper(test.vertx());
        final PostService postService = new DefaultPostService(mongo, POST_SEARCH_WORD, PostController.LIST_ACTION, postPlugin, IContentTransformerClient.noop, IContentTransformerEventRecorder.noop, audienceHelper);
        controllerExplorer = new FoldersControllerExplorer(test.vertx(), blogPlugin);
        blogService = new DefaultBlogService(test.vertx(), mongo, postService, BLOG_PAGING, BLOG_SEARCH_WORD, blogPlugin, audienceHelper);
    }


    static JsonObject createBlog(final String name) {
        return new JsonObject().put("title", name).put("description", "description" + name).put("slug", "slug" + name).put("thumbnail", "thumb" + name).put("comment-type", "IMMEDIATE");
    }

    static JsonObject createFolder(final String name, final Boolean trashed, final Long parentId) {
        return new JsonObject().put("name", name).put("trashed", trashed).put("parentId", parentId);
    }

    static JsonObject createFolder(final String name) {
        return new JsonObject().put("name", name);
    }

    /**
     * <u>GOAL</u> : Ensure that we are able to create a folder tree
     *
     * <u>STEPS</u> :
     * <ol>
     *     <li>Create folder1 for user </li>
     *     <li>Create folder2 for user (child of folder1) </li>
     *     <li>List all folders => Should have 2 folders with folder2 child of folder1 </li>
     * </ol>
     * @param context
     * @throws Exception
     */
    @Test
    public void shouldCreateFolderTree(TestContext context) throws Exception {
        final Async async = context.async();
        final HttpTestHelper.TestHttpServerRequest reqList1 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
        reqList1.response().endJsonArrayHandler(resultList1 -> {
            context.assertEquals(0, resultList1.size());
            // create folder 1
            try {
                final HttpTestHelper.TestHttpServerRequest reqCreate1 = test.http().request(HttpMethod.POST, "/folders", new JsonObject(), createFolder("folder1"));
                reqCreate1.response().endJsonHandler(resultCreate1 -> {
                    context.assertNotNull(resultCreate1, "Created folder1 should not be null");
                    context.assertNotNull(resultCreate1.getValue("_id"), "Created folder1 should have an id");
                    final Long parentId1 = NumberUtils.toLong(resultCreate1.getValue("_id").toString());
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        // create sub folder 2
                        try {
                            final HttpTestHelper.TestHttpServerRequest reqCreate2 = test.http().request(HttpMethod.POST, "/folders", new JsonObject(), createFolder("folder2", false, parentId1));
                            reqCreate2.response().endJsonHandler(resultCreate2 -> {
                                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r5 -> {
                                    try {
                                        context.assertNotNull(resultCreate2, "Created folder2 should not be null");
                                        context.assertNotNull(resultCreate2.getValue("_id"), "Created folder2 should have an id");
                                        context.assertNotNull(resultCreate2.getValue("parentId"), "Created folder2 should have a parent");
                                        final HttpTestHelper.TestHttpServerRequest reqList2 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
                                        reqList2.response().endJsonArrayHandler(resultList2 -> {
                                            context.assertEquals(2, resultList2.size());
                                            final JsonObject folder1 = resultList2.getJsonObject(0);
                                            final JsonObject folder2 = resultList2.getJsonObject(1);
                                            context.assertNotNull(folder1.getValue("_id"));
                                            context.assertEquals("folder1", folder1.getString("name"));
                                            context.assertEquals("root", folder1.getValue("parentId").toString());
                                            context.assertFalse(folder1.getBoolean("trashed"));
                                            context.assertNotNull(folder1.getValue("created"));
                                            context.assertNotNull(folder1.getValue("modified"));
                                            context.assertEquals(0, folder1.getJsonArray("ressourceIds").size());
                                            context.assertNotNull(folder2.getValue("_id"));
                                            context.assertEquals("folder2", folder2.getString("name"));
                                            context.assertEquals(folder1.getValue("_id").toString(), folder2.getValue("parentId").toString());
                                            context.assertFalse(folder2.getBoolean("trashed"));
                                            context.assertNotNull(folder2.getValue("created"));
                                            context.assertNotNull(folder2.getValue("modified"));
                                            context.assertEquals(0, folder2.getJsonArray("ressourceIds").size());
                                            async.complete();
                                        });
                                        controllerExplorer.list(reqList2.withSession(user));
                                    } catch (Exception e) {
                                        context.fail(e);
                                    }
                                }));
                            });
                            controllerExplorer.add(reqCreate2.withSession(user));
                        } catch (Exception e) {
                            context.fail(e);
                        }
                    }));
                });
                controllerExplorer.add(reqCreate1.withSession(user));
            } catch (Exception e) {
                context.fail(e);
            }
        });
        controllerExplorer.list(reqList1.withSession(user));
    }
    /**
     * <u>GOAL</u> : Ensure that we are able to create a folder tree
     *
     * <u>STEPS</u> :
     * <ol>
     *     <li>Create folder1 for user1 </li>
     *     <li>Update folder1 for user1 => renamed to "renamed" </li>
     *     <li>List all folders => Should have 1 folder renamed </li>
     *     <li>Delete folder1 for user1</li>
     *     <li>List all folders => Should have O folders </li>
     * </ol>
     * @param context
     * @throws Exception
     */
    @Test
    public void shouldCrudFolder(TestContext context) throws Exception {
        final Async async = context.async();
        final HttpTestHelper.TestHttpServerRequest reqList1 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
        reqList1.response().endJsonArrayHandler(resultList1 -> {
            context.assertEquals(0, resultList1.size());
            // create folder 1
            try {
                final HttpTestHelper.TestHttpServerRequest reqCreate1 = test.http().request(HttpMethod.POST, "/folders", new JsonObject(), createFolder("folder1"));
                reqCreate1.response().endJsonHandler(resultCreate1 -> {
                    context.assertNotNull(resultCreate1, "Created folder1 should not be null");
                    context.assertNotNull(resultCreate1.getValue("_id"), "Created folder1 should have an id");
                    final Long folderId = NumberUtils.toLong(resultCreate1.getValue("_id").toString());
                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                        // update folder 1
                        try {
                            final HttpTestHelper.TestHttpServerRequest reqCreate2 = test.http().request(HttpMethod.PUT, "/folders", new JsonObject().put("id",folderId.toString()), createFolder("renamed"));
                            reqCreate2.response().endJsonHandler(resultCreate2 -> {
                                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r5 -> {
                                    try {
                                        final HttpTestHelper.TestHttpServerRequest reqList2 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
                                        reqList2.response().endJsonArrayHandler(resultList2 -> {
                                            context.assertEquals(1, resultList2.size());
                                            final JsonObject folder1 = resultList2.getJsonObject(0);
                                            context.assertEquals(folderId.toString(), folder1.getValue("_id"));
                                            context.assertEquals("renamed", folder1.getString("name"));
                                            // delete folder
                                            try {
                                                final HttpTestHelper.TestHttpServerRequest reqDelete = test.http().request(HttpMethod.DELETE, "/folders", new JsonObject().put("id",folderId.toString()));
                                                reqDelete.response().endJsonHandler(resultDelete -> {
                                                    explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r7 -> {
                                                        try {
                                                            final HttpTestHelper.TestHttpServerRequest reqList3 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
                                                            reqList3.response().endJsonArrayHandler(resultList3 -> {
                                                                context.assertEquals(0, resultList3.size());
                                                                async.complete();
                                                            });
                                                            controllerExplorer.list(reqList3.withSession(user1));
                                                        } catch (Exception e) {
                                                            context.fail(e);
                                                        }
                                                    }));
                                                });
                                                controllerExplorer.delete(reqDelete.withSession(user1));
                                            } catch (Exception e) {
                                                context.fail(e);
                                            }
                                        });
                                        controllerExplorer.list(reqList2.withSession(user1));
                                    } catch (Exception e) {
                                        context.fail(e);
                                    }
                                }));
                            });
                            controllerExplorer.update(reqCreate2.withSession(user1));
                        } catch (Exception e) {
                            context.fail(e);
                        }
                    }));
                });
                controllerExplorer.add(reqCreate1.withSession(user1));
            } catch (Exception e) {
                context.fail(e);
            }
        });
        controllerExplorer.list(reqList1.withSession(user1));
    }

    /**
     * <u>GOAL</u> : Ensure that user can see its folders and only its folders
     *
     * <u>STEPS</u> :
     * <ol>
     *     <li>Create folder1 for user2 </li>
     *     <li>Create folder2 for user3 </li>
     *     <li>List folders for user2 => should have 1 folder </li>
     *     <li>List folders for user3 => should have 1 folder </li>
     * </ol>
     * @param context
     * @throws Exception
     */
    @Test
    public void shouldCreateFolderByUser(TestContext context) throws Exception {
        final Async async = context.async();
        final HttpTestHelper.TestHttpServerRequest reqList1 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
        reqList1.response().endJsonArrayHandler(resultList1 -> {
            context.assertEquals(0, resultList1.size());
            // create folder 1 for user 2
            try {
                final HttpTestHelper.TestHttpServerRequest reqCreate1 = test.http().request(HttpMethod.POST, "/folders", new JsonObject(), createFolder("folder1"));
                reqCreate1.response().endJsonHandler(resultCreate1 -> {
                    context.assertNotNull(resultCreate1, "Created folder1 should not be null");
                    context.assertNotNull(resultCreate1.getValue("_id"), "Created folder1 should have an id");
                    // create folder 2 for user3
                    try {
                        final HttpTestHelper.TestHttpServerRequest reqCreate2 = test.http().request(HttpMethod.POST, "/folders", new JsonObject(), createFolder("folder2"));
                        reqCreate2.response().endJsonHandler(resultCreate2 -> {
                            explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r5 -> {
                                try {
                                    context.assertNotNull(resultCreate2, "Created folder2 should not be null");
                                    context.assertNotNull(resultCreate2.getValue("_id"), "Created folder2 should have an id");
                                    // list for user 2
                                    final HttpTestHelper.TestHttpServerRequest reqList2 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
                                    reqList2.response().endJsonArrayHandler(resultList2 -> {
                                        try {
                                            context.assertEquals(1, resultList2.size());
                                            // list for user3
                                            final HttpTestHelper.TestHttpServerRequest reqList3 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
                                            reqList3.response().endJsonArrayHandler(resultList3 -> {
                                                context.assertEquals(1, resultList3.size());
                                                async.complete();
                                            });
                                            controllerExplorer.list(reqList3.withSession(user3));
                                        } catch (Exception e) {
                                            context.fail(e);
                                        }
                                    });
                                    controllerExplorer.list(reqList2.withSession(user2));
                                } catch (Exception e) {
                                    context.fail(e);
                                }
                            }));
                        });
                        controllerExplorer.add(reqCreate2.withSession(user3));
                    } catch (Exception e) {
                        context.fail(e);
                    }
                });
                controllerExplorer.add(reqCreate1.withSession(user2));
            } catch (Exception e) {
                context.fail(e);
            }
        });
        controllerExplorer.list(reqList1.withSession(user2));
    }

    /**
     * <u>GOAL</u> : Ensure that resources are attached to folder
     *
     * <u>STEPS</u> :
     * <ol>
     *     <li>Create folder1 for user4 </li>
     *     <li>Create blog1 for user4 at root</li>
     *     <li>Create blog2 and blog3 for user4 in folder1</li>
     *     <li>List all folders => Should have 1 folder with 2 blogs inside </li>
     * </ol>
     * @param context
     * @throws Exception
     */
    @Test
    public void shouldFetchResourceByFolders(TestContext context) throws Exception {
        final Async async = context.async();
        // create folder1 for user4
        final HttpTestHelper.TestHttpServerRequest reqCreate1 = test.http().request(HttpMethod.POST, "/folders", new JsonObject(), createFolder("folder1"));
        reqCreate1.response().endJsonHandler(resultCreate1 -> {
            context.assertNotNull(resultCreate1, "Created folder1 should not be null");
            context.assertNotNull(resultCreate1.getValue("_id"), "Created folder1 should have an id");
            final Long folderId = NumberUtils.toLong(resultCreate1.getValue("_id").toString());
            explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r0 -> {
                // create blog1 for user4 at root
                final JsonObject b1 = createBlog("blog1");
                blogService.create(b1, user4, false, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(rb1 -> {
                    // create blog2 for user4 in folder1
                    final JsonObject b2 = createBlog("blog2").put("folder", folderId);
                    blogService.create(b2, user4, false, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(rb2 -> {
                        // create blog3 for user4 in folder1
                        final JsonObject b3 = createBlog("blog3").put("folder", folderId);
                        blogService.create(b3, user4, false, test.asserts().asyncAssertSuccessEither(context.asyncAssertSuccess(rb3 -> {
                            // wait pending task
                            blogPlugin.getCommunication().waitPending().onComplete(context.asyncAssertSuccess(r3 -> {
                                explorerTest.ingestJobExecute(true).onComplete(context.asyncAssertSuccess(r4 -> {
                                    try {
                                        // fetch folders of user4
                                        final HttpTestHelper.TestHttpServerRequest reqList1 = test.http().request(HttpMethod.GET, "/folders/list/all", new JsonObject());
                                        reqList1.response().endJsonArrayHandler(resultList1 -> {
                                            context.assertEquals(1, resultList1.size());
                                            final JsonObject folder4 = resultList1.getJsonObject(0);
                                            context.assertEquals(2, folder4.getJsonArray("ressourceIds").size());
                                            async.complete();
                                        });
                                        controllerExplorer.list(reqList1.withSession(user4));
                                    } catch (Exception e) {
                                        context.fail(e);
                                    }
                                }));
                            }));
                        })));
                    })));
                })));
            }));
        });
        controllerExplorer.add(reqCreate1.withSession(user4));
    }
}
