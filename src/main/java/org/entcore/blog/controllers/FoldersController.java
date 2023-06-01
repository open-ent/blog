package org.entcore.blog.controllers;

import io.vertx.core.http.HttpServerRequest;

public interface FoldersController {
	void list(HttpServerRequest request);
	void add(HttpServerRequest request);
	void update(HttpServerRequest request);
	void delete(HttpServerRequest request);
}