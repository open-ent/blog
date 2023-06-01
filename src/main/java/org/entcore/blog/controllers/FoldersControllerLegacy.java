package org.entcore.blog.controllers;

import io.vertx.core.http.HttpServerRequest;
import org.entcore.common.mongodb.MongoDbControllerHelper;

public class FoldersControllerLegacy extends MongoDbControllerHelper implements FoldersController {

	public FoldersControllerLegacy(String collectionName) {
		super(collectionName);
	}
	@Override
	public void list(HttpServerRequest request) {
		super.list(request);
	}

	@Override
	public void add(HttpServerRequest request) {
		create(request);
	}

	@Override
	public void update(HttpServerRequest request) {
		super.update(request);
	}

	@Override
	public void delete(HttpServerRequest request) {
		super.delete(request);
	}
}