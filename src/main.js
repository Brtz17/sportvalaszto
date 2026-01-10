import { client, databases } from "../js/lib/appwrite.js";

export default async ({ req, res, log, error }) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  try {
    // 1. Összes team lekérdezése
    const teams = await databases.listDocuments(
      '68fe32ea0008ab84b709',
      'teams', // feltételezve, hogy van teams collection
      [Query.limit(100)]
    );

    for (const team of teams.documents) {
      // 2. Tegnapi pageview-ök lekérése a team-hez
      const pageviews = await databases.listDocuments(
        '68fe32ea0008ab84b709',
        'pageviews',
        [
          Query.equal('teamId', team.$id),
          Query.equal('date', yesterdayStr),
          Query.limit(5000)
        ]
      );

      if (pageviews.documents.length === 0) continue;

      // 3. Statisztikák számolása
      const uniqueIps = [...new Set(pageviews.documents.map(p => p.ipAddress))];
      const loggedInViews = pageviews.documents.filter(p => p.userId).length;

      // 4. daily_stats frissítése
      await databases.createDocument(
        '68fe32ea0008ab84b709',
        'daily_stats',
        ID.unique(),
        {
          teamId: team.$id,
          date: yesterdayStr,
          totalViews: pageviews.documents.length,
          uniqueVisitors: uniqueIps.length,
          loggedInViews: loggedInViews
        }
      );

      log(`Processed team ${team.name}: ${pageviews.documents.length} views`);
    }

    return res.json({ success: true, message: 'Daily stats updated' });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
