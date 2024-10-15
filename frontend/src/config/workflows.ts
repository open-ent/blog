export const workflows = {
  access: 'org.entcore.blog.controllers.BlogController|blog',
  create: 'org.entcore.blog.controllers.BlogController|create',
  createPublic: 'org.entcore.blog.controllers.BlogController|createPublicBlog',
  publish: 'org.entcore.blog.controllers.BlogController|publish',
  print: 'org.entcore.blog.controllers.BlogController|print',
} as const;
