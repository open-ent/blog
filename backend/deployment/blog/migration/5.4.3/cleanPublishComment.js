const KEY = "org-entcore-blog-controllers-PostController|publishComment";
const BATCH_SIZE = 500;
const DRY_RUN = false;

print("=== CLEAN PUBLISH COMMENT ===\n");

const query = {
  shared: {
    $elemMatch: {
      [KEY]: { $exists: true }
    }
  }
};

let totalModified = 0;
let totalMatched = 0;

const cursor = db.blogs.find(query);

try {
  let batch = [];
  
  cursor.forEach(doc => {
    totalMatched++;
    
    if (!DRY_RUN) {
      const newShared = doc.shared
        .map(s => {
          if (s && s[KEY]) {
            const copy = Object.assign({}, s);
            delete copy[KEY];
            return copy;
          }
          return s;
        })
        .filter(s => s !== null);
      
      batch.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { shared: newShared } }
        }
      });
      
      if (batch.length >= BATCH_SIZE) {
        const result = db.blogs.bulkWrite(batch, { ordered: false });
        totalModified += result.modifiedCount;
        print(`Batch: ${batch.length} | Modified: ${result.modifiedCount}`);
        batch = [];
      }
    }
  });
  
  if (!DRY_RUN && batch.length > 0) {
    const result = db.blogs.bulkWrite(batch, { ordered: false });
    totalModified += result.modifiedCount;
    print(`Final batch: ${batch.length} | Modified: ${result.modifiedCount}`);
  }
} finally {
  cursor.close();
}

print(`\n=== SUMMARY ===`);
print(`Documents matched: ${totalMatched}`);

if (DRY_RUN) {
  print(`\n[DRY-RUN] ${totalMatched} documents would be modified`);
  print(`Set DRY_RUN = false to apply`);
} else {
  print(`\n[APPLIED] Total modified: ${totalModified}`);
}
