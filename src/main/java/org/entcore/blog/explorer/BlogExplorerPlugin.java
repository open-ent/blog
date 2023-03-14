package org.entcore.blog.explorer;

import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import org.entcore.blog.Blog;
import org.entcore.common.explorer.ExplorerMessage;
import org.entcore.common.explorer.ExplorerPluginFactory;
import org.entcore.common.explorer.IExplorerPlugin;
import org.entcore.common.explorer.IExplorerPluginCommunication;
import org.entcore.common.explorer.impl.ExplorerPluginResourceMongo;
import org.entcore.common.explorer.impl.ExplorerSubResource;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class BlogExplorerPlugin extends ExplorerPluginResourceMongo {
    public static final String APPLICATION = Blog.APPLICATION;
    public static final String TYPE = Blog.BLOG_TYPE;
    public static final String COLLECTION = Blog.BLOGS_COLLECTION;
    static Logger log = LoggerFactory.getLogger(BlogExplorerPlugin.class);
    private final MongoClient mongoClient;
    private final BlogFoldersExplorerPlugin folderPlugin;
    private final PostExplorerPlugin postPlugin;
    private ShareService shareService;

    public static BlogExplorerPlugin create() throws Exception {
        final IExplorerPlugin plugin = ExplorerPluginFactory.createMongoPlugin((params)->{
            return new BlogExplorerPlugin(params.getCommunication(), params.getDb());
        });
        return (BlogExplorerPlugin) plugin;
    }

    public BlogExplorerPlugin(final IExplorerPluginCommunication communication, final MongoClient mongoClient) {
        super(communication, mongoClient);
        this.mongoClient = mongoClient;
        //init folder plugin
        this.folderPlugin = new BlogFoldersExplorerPlugin(this);
        //init subresource plugin
        this.postPlugin = new PostExplorerPlugin(this);
    }

    public PostExplorerPlugin postPlugin(){ return postPlugin; }

    public BlogFoldersExplorerPlugin folderPlugin(){ return folderPlugin; }

    public MongoClient getMongoClient() {return mongoClient;}

    public ShareService createShareService(final Map<String, SecuredAction> securedActions, final Map<String, List<String>> groupedActions) {
        this.shareService = createMongoShareService(Blog.BLOGS_COLLECTION, securedActions, groupedActions);
        return this.shareService;
    }

    @Override
    protected Optional<ShareService> getShareService() {
        return Optional.ofNullable(shareService);
    }

    @Override
    protected String getApplication() { return APPLICATION; }

    @Override
    protected String getResourceType() { return TYPE; }

    @Override
    protected Future<ExplorerMessage> doToMessage(final ExplorerMessage message, final JsonObject source) {
        final JsonObject custom = new JsonObject().put("slug", source.getString("slug", ""));
        custom.put("publish-type", source.getString("publish-type", ""));
        message.withName(source.getString("title", ""));
        message.withContent(source.getString("description", ""), ExplorerMessage.ExplorerContentType.Html);
        message.withPublic("PUBLIC".equals(source.getString("visibility")));
        message.withTrashed(source.getBoolean("trashed", false));
        message.withShared(source.getJsonArray("shared"));
        message.withThumbnail(source.getString("thumbnail"));
        message.withDescription(source.getString("description"));
        message.withCustomFields(custom);
        return Future.succeededFuture(message);
    }

    @Override
    protected String getCollectionName() { return COLLECTION; }

    @Override
    protected String getCreatedAtColumn() {
        return "created";
    }

    @Override
    public UserInfos getCreatorForModel(JsonObject json) {
        final JsonObject author = json.getJsonObject("author");
        final UserInfos user = new UserInfos();
        user.setUserId( author.getString("userId"));
        user.setUsername(author.getString("username"));
        user.setLogin(author.getString("login"));
        return user;
    }

    @Override
    protected void setCreatorForModel(UserInfos user, JsonObject json) {
        final JsonObject author = new JsonObject();
        author.put("userId", user.getUserId());
        author.put("username", user.getUsername());
        author.put("login", user.getLogin());
        json.put("author", author);
    }

    @Override
    protected List<ExplorerSubResource> getSubResourcesPlugin() {
        return Collections.singletonList(postPlugin);
    }

}
