/*
 * Copyright © "Edifice" (SAS “WebServices pour l’Education”), 2024
 *
 * This program is published by "Edifice" (SAS “WebServices pour l’Education”).
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Edifice" with a reference to the website: https://edifice.io/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

package org.entcore.blog.security.filter.comment;

import fr.wseduc.mongodb.MongoDb;
import fr.wseduc.webutils.http.Binding;
import org.entcore.common.http.filter.ResourcesProvider;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;

import static org.entcore.common.utils.StringUtils.isEmpty;

public abstract class CommentFilter implements ResourcesProvider {
	/** Required data for comment filters. */
	public static class Data {
		public HttpServerRequest request;
		public Binding binding;
		public String blogId;
		public String postId;
		public String commentId;
		public String right;

		private Data() {};

		public boolean isSane() {
			return !(isEmpty(blogId) || isEmpty(postId) || isEmpty(commentId));
		}

		static public Data fromRequest(HttpServerRequest resourceRequest, Binding filterBinding) {
			final Data data = new Data();
			data.request = resourceRequest;
			data.binding = filterBinding;
			data.blogId = resourceRequest.params().get("blogId");
			data.postId = resourceRequest.params().get("postId");
			data.commentId = resourceRequest.params().get("commentId");
			data.right = filterBinding.getServiceMethod().replaceAll("\\.", "-");
			return data;
		}
	}

    protected MongoDb mongo = MongoDb.getInstance();

	@Override
	public void authorize(HttpServerRequest request, Binding binding, UserInfos user, Handler<Boolean> handler) {
		final CommentFilter.Data data = Data.fromRequest(request, binding);

		if (data.isSane()) {
			authorize(data, user, handler);
		} else {
			handler.handle(false);
		}
	}

	// Needs to be overriden by inheritng classes.
	public abstract void authorize(CommentFilter.Data data, UserInfos user, Handler<Boolean> handler);

	protected void executeCountQuery(final HttpServerRequest request, String collection, JsonObject query,
			final int expectedCountResult, final Handler<Boolean> handler) {
		request.pause();
		mongo.count(collection, query, new Handler<Message<JsonObject>>() {
			@Override
			public void handle(Message<JsonObject> event) {
				request.resume();
				JsonObject res = event.body();
				handler.handle(res != null && "ok".equals(res.getString("status"))
						&& expectedCountResult == res.getInteger("count"));
			}
		});
	}
}
