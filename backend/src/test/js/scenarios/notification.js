import chai, { describe } from 'https://jslib.k6.io/k6chaijs/4.3.4.2/index.js';
import {
  authenticateWeb,
  getUsersOfSchool,
  createDefaultStructure,
  createAndSetRole,
  linkRoleToUsers,
  activateUsers,
  getRandomUserWithProfile,
  assertCondition,
  assertOk,
  lastNotifications,
  switchSession,
  getHeaders
} from "https://raw.githubusercontent.com/juniorode/edifice-k6-commons/develop/dist/index.js";
import http from "k6/http";
import { addShareToUser, createBlog, createPost, publishPost, deletePost } from '../utils.js';
import { check } from 'k6';
const maxDuration = __ENV.MAX_DURATION || "1m";
const gracefulStop = parseInt(__ENV.GRACEFUL_STOP || "2s");
chai.config.logFailures = true;
const rootUrl = __ENV.ROOT_URL;

export const options = {
  setupTimeout: "1h", 
  thresholds: {
    checks: ["rate == 1.00"],
  },
  scenarios: {
    notifyPost: {
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
  return { structure };
}
function lastNotifications2(session) {
  const headers = getHeaders(session);
  headers['accept'] = 'application/json;version=3.0'
  const res = http.get(`${rootUrl}/timeline/lastNotifications`, {headers});
  let notifications;
  if(res.status === 200) {
    notifications = JSON.parse(res.body).results;
  } else {
    notifications = null;
  }
  console.log('notifications', notifications)
  return notifications;
}

export default (data) => {
  const { structure } = data;
  describe('[Blog] Check timeline notification format', () => {
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
      const post = createPost(`Post à partager`, POST_CONTENT, blog, authorSession);
      assertCondition(() => post && post.id, 'Post should be created')
      let res = publishPost(blog, post, authorSession);
      assertOk(res, 'publish post');


      const contribSession = authenticateWeb(contrib.login, 'password');
      switchSession(contribSession)
      const notifications = lastNotifications2(contribSession);
      const isOk = check(notifications, {
        "should be notified of the publication": (nots) => nots.length >= 1,
        "notification concerns this blog": (nots) => nots && nots[0].resource === blog.id,
        "notification concerns this post": (nots) => nots && nots[0].params.postUri.endsWith(post.id)
      })
      if(isOk) {
        check(notifications[0].preview, {
          "notification has  preview": preview => !!preview,
          "preview has images": (preview) => preview.images && preview.images.length == 1,
          "plain text is ok": preview => preview.text === 'Coucou voici un paragraphe.Et un deuxièmeTitreCol 1Col 2Row 1 et un petit texteContenuContenu 2Row 2Contenu 3Contenu 4ImageEt avec un peu de modifica…',
          "medias are ok": preview => {
            const medias = preview.medias;
            let ok = check(medias, {
              'number of medias should be 6': (m) => m.length === 6
            });
            // Image
            ok = assertMediaProps(medias[0], 'image', '/workspace/document/ebfba26d-f195-42d3-be4c-d15f0f1b838b') && ok;
            ok = assertMediaProps(medias[1], 'iframe', 'https://www.youtube.com/embed/iENAm60rSbA?si=f5BfWYQ9OLdlHuqu') && ok;
            ok = assertMediaProps(medias[2], 'audio', '/workspace/document/05a07fda-0efb-4d62-a951-f7c898d872a6') && ok;
            ok = assertMediaProps(medias[3], 'attachment', '/workspace/document/45132d8a-51dd-4e45-a2de-2ef2adf73e74') && ok;
            ok = assertMediaProps(medias[4], 'attachment', '/workspace/document/ba9d25b8-d7d7-4ca3-a850-0fb808641d9a') && ok;
            ok = assertMediaProps(medias[5], 'video', '/workspace/document/8a1d14b4-2943-4680-83e6-d74f380a57b8',
              'document-id', '8a1d14b4-2943-4680-83e6-d74f380a57b8', 'width', '350', 'height', '197', 'document-is-captation', 'true',
              'video-resolution', '350x197') && ok;
              return ok;
            }
        });
      } else {

      }
  })
}

function assertMediaProps(media, type, source) {
  let ok = check(media, {
      'wrong type for media': (m) => m.type === type,
      'wrong source for media': (m) => m.src === source
  });

  if (arguments.length > 3) {
      for (let i = 3; i < arguments.length - 1; i++) {
          const key = arguments[i++];
          const expectedValue = arguments[i];
          ok = check(media, {
              [`wrong ${key} for media`]: (m) => m[key] === expectedValue
          }) && ok;
      }
  }
  return ok;
}

const POST_CONTENT = `<p>Coucou voici un paragraphe.</p><p>Et un deuxième</p><table style="minWidth: 321px"><colgroup><col><col><col style="width: 271px"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>Titre</p></th><th colspan="1" rowspan="1"><p>Col 1</p></th><th colspan="1" rowspan="1" colwidth="271"><p>Col 2</p></th></tr><tr><td colspan="1" rowspan="1"><p>Row 1 et un petit texte</p></td><td colspan="1" rowspan="1"><p>Contenu</p></td><td colspan="1" rowspan="1" colwidth="271"><p>Contenu 2</p></td></tr><tr><td colspan="1" rowspan="1"><p>Row 2</p></td><td colspan="1" rowspan="1"><p>Contenu 3</p></td><td colspan="1" rowspan="1" colwidth="271"><p>Contenu 4</p></td></tr></tbody></table><p>Image</p><p><img class="custom-image" src="/workspace/document/ebfba26d-f195-42d3-be4c-d15f0f1b838b" width="350"></p><p>Et avec un <span style="color: rgb(255, 58, 85)">peu de modific</span>ation de <strong><em>style.</em></strong></p><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.youtube.com/watch?v=iENAm60rSbA" title="">DJ</a></p><div class="iframe-wrapper"><iframe src="https://www.youtube.com/embed/iENAm60rSbA?si=f5BfWYQ9OLdlHuqu" frameborder="0" allowfullscreen width="560" height="315"></iframe></div><p></p><div class="audio-wrapper"><audio src="/workspace/document/05a07fda-0efb-4d62-a951-f7c898d872a6" data-document-id="05a07fda-0efb-4d62-a951-f7c898d872a6"></audio></div><p>.</p><div class="attachments"><a name="images.jpeg\n            " href="/workspace/document/45132d8a-51dd-4e45-a2de-2ef2adf73e74" documentId="45132d8a-51dd-4e45-a2de-2ef2adf73e74">images.jpeg\n            </a><a name="file (13).png\n            " href="/workspace/document/ba9d25b8-d7d7-4ca3-a850-0fb808641d9a" documentId="ba9d25b8-d7d7-4ca3-a850-0fb808641d9a">file (13).png\n            </a></div><p></p><div class="video-wrapper"><video src="/workspace/document/8a1d14b4-2943-4680-83e6-d74f380a57b8" controls="true" data-document-id="8a1d14b4-2943-4680-83e6-d74f380a57b8" data-document-is-captation="true" data-video-resolution="350x197" width="350" height="197"></video></div>`