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
import org.entcore.blog.Blog;
import org.entcore.common.explorer.ExplorerMessage;
import org.entcore.common.explorer.IExplorerFolderTree;
import org.entcore.common.explorer.impl.ExplorerFolderTreeMongo;
import org.entcore.common.explorer.impl.ExplorerSubResourceMongo;
import org.entcore.common.user.UserInfos;

import java.time.LocalDateTime;
import java.util.Collection;

public class FolderExplorerPlugin extends ExplorerFolderTreeMongo {
    public static final String TYPE = IExplorerFolderTree.FOLDER_TYPE;
    public static final String COLLECTION = "blogsFolders";
    static Logger log = LoggerFactory.getLogger(FolderExplorerPlugin.class);

    public FolderExplorerPlugin(final BlogExplorerPlugin plugin) {
        super(plugin, plugin.getMongoClient());
    }

    @Override
    protected String getCollectionName() { return COLLECTION; }

    @Override
    protected String getCreatedAtColumn() {
        return "created";
    }

    @Override
    protected Object toMongoDate(LocalDateTime date) {
        return MongoDb.toMongoDate(date);
    }

}
