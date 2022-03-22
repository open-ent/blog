package org.entcore.blog.explorer;

import com.mongodb.QueryBuilder;
import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.mongodb.MongoQueryBuilder;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.mongo.MongoClient;
import io.vertx.ext.mongo.MongoClientDeleteResult;
import org.bson.conversions.Bson;
import org.entcore.blog.Blog;
import org.entcore.common.explorer.*;
import org.entcore.common.explorer.impl.ExplorerDbMongo;
import org.entcore.common.explorer.impl.ExplorerSubResourceDb;
import org.entcore.common.user.UserInfos;
import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Projections.*;

import java.time.LocalDateTime;
import java.util.Collection;

public class PostExplorerPlugin extends ExplorerSubResourceDb {
    public static final String APPLICATION = Blog.APPLICATION;
    public static final String TYPE = Blog.BLOG_TYPE;
    public static final String COLLECTION = Blog.POSTS_COLLECTION;
    static Logger log = LoggerFactory.getLogger(PostExplorerPlugin.class);

    public PostExplorerPlugin(final BlogExplorerPlugin plugin) {
        super(plugin, new PostResourceCrud(plugin.getMongoClient()));
    }

    @Override
    protected UserInfos getCreatorForModel(final JsonObject json) {
        final JsonObject author = json.getJsonObject("author");
        final UserInfos user = new UserInfos();
        user.setUserId( author.getString("userId"));
        user.setUsername(author.getString("username"));
        user.setLogin(author.getString("login"));
        return user;
    }

    @Override
    public Future<Void> onDeleteParent(final Collection<String> ids) {
        if(ids.isEmpty()) {
            return Future.succeededFuture();
        }
        final MongoClient mongo = ((BlogExplorerPlugin)super.parent).getMongoClient();
        final JsonObject filter = MongoQueryBuilder.build(QueryBuilder.start("blog.$id").in(ids));
        final Promise<MongoClientDeleteResult> promise = Promise.promise();
        log.info("Deleting post related to deleted blog. Number of blogs="+ids.size());
        mongo.removeDocuments(COLLECTION, filter, promise);
        return promise.future().map(e->{
            log.info("Deleted post related to deleted blog. Number of posts="+e.getRemovedCount());
            return null;
        });
    }

    @Override
    protected String getParentId(JsonObject jsonObject) {
        final JsonObject blogRef = jsonObject.getJsonObject("blog");
        final String blogId = blogRef.getString("$id");
        return blogId;
    }

    @Override
    protected Future<ExplorerMessage> toMessage(final ExplorerMessage message, final JsonObject source) {
        final String id = source.getString("_id");
        message.withSubResourceHtml(id, source.getString("content",""));
        return Future.succeededFuture(message);
    }

    static class PostResourceCrud extends ExplorerDbMongo {

        public PostResourceCrud(final MongoClient mongoClient) {
            super(mongoClient);
        }

        @Override
        protected String getCollectionName() { return COLLECTION; }

        @Override
        protected Object toMongoDate(LocalDateTime date) {
            return MongoDb.toMongoDate(date);
        }
    }

}
