package org.entcore.blog.explorer;

import fr.wseduc.webutils.security.SecuredAction;
import io.vertx.core.Future;
import io.vertx.core.json.JsonArray;
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
import org.entcore.common.share.ShareModel;
import org.entcore.common.share.ShareService;
import org.entcore.common.user.UserInfos;
import fr.wseduc.mongodb.MongoDb;

import java.util.*;

import static io.vertx.core.Future.failedFuture;

public class BlogExplorerPlugin extends ExplorerPluginResourceMongo {
    public static final String APPLICATION = Blog.APPLICATION;
    public static final String TYPE = Blog.BLOG_TYPE;
    public static final String COLLECTION = Blog.BLOGS_COLLECTION;
    static Logger log = LoggerFactory.getLogger(BlogExplorerPlugin.class);
    private final MongoClient mongoClient;
    private final BlogFoldersExplorerPlugin folderPlugin;
    private final PostExplorerPlugin postPlugin;
    private ShareService shareService;
    private final Map<String, SecuredAction> securedActions;

    public static Future<BlogExplorerPlugin> create(final Map<String, SecuredAction> securedActions) {
      try {
        return ExplorerPluginFactory
          .createMongoPlugin((params)-> new BlogExplorerPlugin(params.getCommunication(), params.getDb(), securedActions))
          .map(plugin -> (BlogExplorerPlugin) plugin);
      } catch (Exception e) {
        return failedFuture(e);
      }
    }

    public BlogExplorerPlugin(final IExplorerPluginCommunication communication, final MongoClient mongoClient, final Map<String, SecuredAction> securedActions) {
        super(communication, mongoClient);
        this.mongoClient = mongoClient;
        this.securedActions = securedActions;
        //init folder plugin
        this.folderPlugin = new BlogFoldersExplorerPlugin(this);
        //init subresource plugin
        this.postPlugin = new PostExplorerPlugin(this);
    }

    public PostExplorerPlugin postPlugin(){ return postPlugin; }

    public BlogFoldersExplorerPlugin folderPlugin(){ return folderPlugin; }

    public MongoClient getMongoClient() {return mongoClient;}

    public ShareService createShareService(final Map<String, List<String>> groupedActions) {
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
        final Optional<String> creatorId = getCreatorForModel(source).map(e -> e.getUserId());
        final JsonObject custom = new JsonObject().put("slug", source.getString("slug", ""));
        custom.put("publish-type", source.getString("publish-type", ""));
        message.withName(source.getString("title", ""));
        message.withContent(source.getString("description", ""), ExplorerMessage.ExplorerContentType.Html);
        message.withPublic("PUBLIC".equals(source.getString("visibility")));
        message.withTrashed(source.getBoolean("trashed", false));
        // "shared" only has meaning if it was explicitly set, otherwise it will reset the resources' shares
        if(source.containsKey("shared")) {
            final ShareModel shareModel = new ShareModel(source.getJsonArray("shared", new JsonArray()), securedActions, creatorId);
            message.withShared(shareModel);
        }
        message.withThumbnail(source.getString("thumbnail"));
        message.withDescription(source.getString("description"));
        message.withCustomFields(custom);
        // set updated date
        final Object modified = source.getValue("modified");
        if(modified != null && modified instanceof JsonObject){
            message.withUpdatedAt(MongoDb.parseIsoDate((JsonObject) modified));
        }
        return Future.succeededFuture(message);
    }

    @Override
    public Map<String, SecuredAction> getSecuredActions() {
        return securedActions;
    }

    @Override
    protected String getCollectionName() { return COLLECTION; }

    @Override
    protected String getCreatedAtColumn() {
        return "created";
    }

    @Override
    public Optional<UserInfos> getCreatorForModel(final JsonObject json) {
        if(!json.containsKey("author") || !json.getJsonObject("author").containsKey("userId")){
            return Optional.empty();
        }
        final JsonObject author = json.getJsonObject("author");
        final UserInfos user = new UserInfos();
        user.setUserId( author.getString("userId"));
        user.setUsername(author.getString("username"));
        user.setLogin(author.getString("login"));
        return Optional.ofNullable(user);
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
