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

import fr.wseduc.mongodb.MongoQueryBuilder;
import org.bson.conversions.Bson;
import org.entcore.common.user.UserInfos;
import io.vertx.core.Handler;

import static com.mongodb.client.model.Filters.*;

public class CommentAuthorFilter extends CommentFilter {

	@Override
	public void authorize(CommentFilter.Data data, UserInfos user, Handler<Boolean> handler) {
		// Check if this user is the author of the post comment.
		final Bson query = and(
			eq("_id", data.postId),
			elemMatch("comments", and(
				eq("id", data.commentId),
				eq("author.userId", user.getUserId())
			))
		);
		executeCountQuery(data.request, "posts", MongoQueryBuilder.build(query), 1, handler);
    }
}
