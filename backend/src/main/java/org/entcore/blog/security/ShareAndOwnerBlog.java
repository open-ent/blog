package org.entcore.blog.security;

import com.mongodb.DBObject;
import fr.wseduc.mongodb.MongoQueryBuilder;
import fr.wseduc.webutils.http.Binding;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpServerRequest;
import org.bson.conversions.Bson;
import org.entcore.common.http.filter.MongoAppFilter;
import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.mongodb.MongoDbConf;
import org.entcore.common.user.UserInfos;

import java.util.ArrayList;
import java.util.List;

import static com.mongodb.client.model.Filters.*;

public class ShareAndOwnerBlog implements ResourcesProvider {
    private MongoDbConf conf = MongoDbConf.getInstance();

    public ShareAndOwnerBlog() {
    }

    public void authorize(HttpServerRequest request, Binding binding, UserInfos user, Handler<Boolean> handler) {
        String id = request.params().get(this.conf.getResourceIdLabel());
        if (id != null && !id.trim().isEmpty()) {
            final List<Bson> groups = new ArrayList();
            final String sharedMethod = binding.getServiceMethod().replaceAll("\\.", "-");
            groups.add(and(eq("userId", user.getUserId()), eq(sharedMethod, true)));

          for (String gpId : user.getGroupsIds()) {
            groups.add(and(eq("groupId", gpId), eq(sharedMethod, true)));
          }
            final Bson query = and(
              eq("_id", (id)),
              or(
                eq("author.userId", user.getUserId()),
                elemMatch("shared", or(groups))
              )
          );
            MongoAppFilter.executeCountQuery(request, this.conf.getCollection(), MongoQueryBuilder.build(query), 1, handler);
        } else {
            handler.handle(false);
        }

    }
}
