import chai, { describe } from 'https://jslib.k6.io/k6chaijs/4.3.4.2/index.js';
import {
  checkStatus,
  authenticateWeb,
  getUsersOfSchool,
  createDefaultStructure,
  createAndSetRole,
  linkRoleToUsers,
  activateUsers,
  switchSession,
  getRandomUserWithProfile,
  assertCondition
} from "https://raw.githubusercontent.com/juniorode/edifice-k6-commons/develop/dist/index.js";
import { addShareToUser, createBlog, createPost, deletePost } from '../utils.js';
const maxDuration = __ENV.MAX_DURATION || "1m";
const gracefulStop = parseInt(__ENV.GRACEFUL_STOP || "2s");
chai.config.logFailures = true;

export const options = {
  setupTimeout: "1h",
  thresholds: {
    checks: ["rate == 1.00"],
  },
  scenarios: {
    shareBlog: {
      executor: "per-vu-iterations",
      vus: 1,
      maxDuration: "30s",
      maxDuration: maxDuration,
      gracefulStop,
    },
  },
};

export function setup() {
  let structure;
  describe("[Blog-Init] Initialize data", () => {
    const session = authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
    structure = createDefaultStructure()
    const role = createAndSetRole('Blog', session);
    const groups = [
      `Teachers from group ${structure.name}.`,
      `Enseignants du groupe ${structure.name}.`,
      `Students from group ${structure.name}.`,
      `Élèves du groupe ${structure.name}.`,
      `Relatives from group ${structure.name}.`,
      `Parents du groupe ${structure.name}.`
    ]
    linkRoleToUsers(structure, role, groups, session);
    activateUsers(structure, session);
  });
  return { structure};
}

export default (data) => {
  const { structure } = data;
  describe('[Blog] Needs to be author to delete a post', () => {
      const session = authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
      const users = getUsersOfSchool(structure, session);
      const author = getRandomUserWithProfile(users, 'Teacher');
      const contrib = getRandomUserWithProfile(users, 'Teacher', [author]);
      console.log("Author - ", author.login);
      console.log("Contributor - ", contrib.login);
      const authorSession = authenticateWeb(author.login, 'password');
      const blog = createBlog(`Super Blog de ${author.login} - ${Date.now()}`, authorSession)
      assertCondition(() => blog && blog.id, 'Blog should have been created')
      addShareToUser(blog, contrib, 'contrib', authorSession);
      const post = createPost(`Post à partager`, `Mon post de ouf`, blog, authorSession);
      assertCondition(() => post && post.id, 'Post should be created')
      const contribSession = authenticateWeb(contrib.login, 'password');
      checkStatus(deletePost(blog, post, contribSession), 'cannot delete post as a contributor', 401);
      switchSession(authorSession)
      checkStatus(deletePost(blog, post, authorSession), 'can delete post as the author', 204);
  })
}