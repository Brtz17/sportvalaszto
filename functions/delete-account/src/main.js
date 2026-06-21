import { Client, Users, Databases, Query } from 'node-appwrite';

const DATABASE_ID = '68fe32ea0008ab84b709';
const TEAMS_COLLECTION_ID = 'csapatok';

export default async function (context) {
  const req = context.req;
  const res = context.res;

  context.log('Function indul...');

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key']);

  const users = new Users(client);
  const databases = new Databases(client);

  const userId = req.headers['x-appwrite-user-id'];
  context.log('Hívó userId: ' + userId);

  if (!userId) {
    context.log('Nincs userId a headerben - nincs bejelentkezve a hívó.');
    return res.json({ error: 'Nincs bejelentkezve.' }, 401);
  }

  try {
    context.log('User adatainak lekérése...');
    const userData = await users.get(userId);
    const userEmail = userData.email;
    context.log('User email: ' + userEmail);

    let hasMore = true;
    let lastId = null;
    let deletedTeamsCount = 0;

    while (hasMore) {
      const queries = [Query.equal('userEmail', userEmail), Query.limit(100)];
      if (lastId) queries.push(Query.cursorAfter(lastId));

      context.log('Csapat dokumentumok lekérése, DATABASE_ID=' + DATABASE_ID + ', TEAMS_COLLECTION_ID=' + TEAMS_COLLECTION_ID);
      const teamDocs = await databases.listDocuments(DATABASE_ID, TEAMS_COLLECTION_ID, queries);
      context.log('Talált csapat dokumentumok száma: ' + teamDocs.documents.length);

      for (const doc of teamDocs.documents) {
        await databases.deleteDocument(DATABASE_ID, TEAMS_COLLECTION_ID, doc.$id);
        deletedTeamsCount++;
      }

      hasMore = teamDocs.documents.length === 100;
      lastId = teamDocs.documents.length > 0
        ? teamDocs.documents[teamDocs.documents.length - 1].$id
        : null;
    }

    context.log('Összesen törölt csapat dokumentum: ' + deletedTeamsCount);
    context.log('User törlése az Auth-ból...');
    await users.delete(userId);
    context.log('User törölve. Function sikeresen befejeződött.');

    return res.json({
      success: true,
      message: 'Fiók és kapcsolódó adatok sikeresen törölve.',
      deletedTeamsCount,
    });
  } catch (error) {
    context.error('HIBA: ' + error.message);
    context.error('Stack: ' + error.stack);
    return res.json({ error: error.message }, 400);
  }
}