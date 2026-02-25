const KEY = "org-entcore-blog-controllers-PostController|publishComment";
const DRY_RUN = true;

print("=== CHECK PUBLISH COMMENT ===\n");

const query = {
  shared: {
    $elemMatch: {
      [KEY]: { $exists: true }
    }
  }
};

const cursor = db.blogs.find(query);

let totalMatch = 0;
let totalScanned = 0;

cursor.forEach(doc => {
  totalScanned++;
  const count = doc.shared.filter(s => s && s[KEY]).length;
  count && print(`[${doc._id}] "${doc.title}" (${doc.author?.login}) - ${count} share(s) to remove`);
  totalMatch++;
});

cursor.close();

print(`\n=== SUMMARY ===`);
print(`Documents scanned: ${totalScanned}`);
print(`Documents with matches: ${totalMatch}`);

