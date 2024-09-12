import chai, { describe } from "https://jslib.k6.io/k6chaijs/4.3.4.2/index.js";
import {
  checkReturnCode,
  authenticateWeb,
  getUsersOfSchool,
  createDefaultStructure,
  createAndSetRole,
  linkRoleToUsers,
  activateUsers,
  switchSession,
  getRandomUserWithProfile,
  assertOk,
  assertCondition,
  Session,
} from "https://raw.githubusercontent.com/edificeio/edifice-k6-commons/develop/dist/index.js";
import {
  addShareToUser,
  createBlog,
  createPost,
  publishPost,
  createComment,
  updateComment,
  deleteComment,
} from "../utils.js";
const maxDuration = __ENV.MAX_DURATION || "1m";
const gracefulStop = parseInt(__ENV.GRACEFUL_STOP || "2s");
chai.config.logFailures = true;

export const options = {
  setupTimeout: "1h",
  thresholds: {
    checks: ["rate == 1.00"],
  },
  scenarios: {
    updateComment: {
      executor: "per-vu-iterations",
      vus: 1,
      maxDuration: "30s",
      maxDuration: maxDuration,
      gracefulStop,
    },
  },
};

export function setup() {
  let context;
  describe("[Blog-Init] Initialize data", () => {
    const session = authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
    const structure = createDefaultStructure("Pwet camembert 3", 'tiny');
    const role = createAndSetRole("Blog", session);
    const groups = [
      `Teachers from group ${structure.name}.`,
      `Enseignants du groupe ${structure.name}.`,
      `Students from group ${structure.name}.`,
      `Élèves du groupe ${structure.name}.`,
      `Relatives from group ${structure.name}.`,
      `Parents du groupe ${structure.name}.`,
    ];
    linkRoleToUsers(structure, role, groups, session);
    activateUsers(structure, session);

    context = initContext(structure, session);
  });
  return context;
}

function initContext(structure, session) {
  const users = getUsersOfSchool(structure, session);
  const author = getRandomUserWithProfile(users, "Teacher");
  const commentator = getRandomUserWithProfile(users, "Student", [author]);
  console.log("Author - ", author.login);
  console.log("Commentator - ", commentator.login);
  const authorSession = authenticateWeb(author.login);
  const blog = createBlog(
    `Test - Blog de ${author.login} - ${Date.now()}`,
    authorSession,
    "IMMEDIATE",
    "IMMEDIATE"
  );
  assertCondition(() => blog && blog.id, "Blog should have been created");

  const post = createPost(
    `Hyper intéressant`,
    `Qu'en dites-vous ?`,
    blog,
    authorSession
  );
  assertCondition(() => post && post.id, "Post should be created");

  addShareToUser(blog, commentator, ["read", "comment"], authorSession);
  assertOk( publishPost(blog, post, authorSession), 'publish post');

  const commentatorSession = authenticateWeb(commentator.login, "password");  
  switchSession(commentatorSession);
  const comment = createComment(
    blog, 
    post,
    "Commentaire initial", 
    commentatorSession
  );
  assertCondition(() => comment && comment.id, "Comment should be created");

  return {
    structure,
    admin: {session},
    author: {user: author, session: authorSession},
    commentator: {user: commentator, session: commentatorSession},
    blog, 
    post,
    comment
  };
}

export default (context) => {
  const { blog, post, comment, author, commentator } = context;
  // Force sessions type
  const authorSession = Session.from(author.session);
  const commentatorSession = Session.from(commentator.session);

  describe("[Blog] Needs to be author to update a comment", () => {
    switchSession(authorSession);
    checkReturnCode(
      updateComment(blog, post, comment, "Commentaire vérolé", authorSession),
      "cannot update another user's comment",
      401
    );
    switchSession(commentatorSession);
    checkReturnCode(
      updateComment(blog, post, comment, "Commentaire modifié", commentatorSession),
      "can update comment as the commentator",
      200
    );
  });

  describe("[Blog] Does not need to be author to delete a comment", () => {
    switchSession(authorSession);
    checkReturnCode(
      deleteComment(blog, post, comment, authorSession),
      "can delete another user's comment",
      200
    );
  });
};
