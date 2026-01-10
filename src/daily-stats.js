// src/daily-stats.js - Appwrite Function
import { client, databases, Query, ID } from "../js/lib/appwrite.js";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  try {
    log(`Processing daily stats for date: ${yesterdayStr}`);
    
    // 1. Összes team lekérdezése
    const teams = await databases.listDocuments(
      '68fe32ea0008ab84b709',
      'teams', // vagy 'csapatok' - melyik a helyes collection neved?
      [Query.limit(100)]
    );

    log(`Found ${teams.total} teams to process`);

    let processedTeams = 0;
    let totalViews = 0;

    for (const team of teams.documents) {
      try {
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

        if (pageviews.documents.length === 0) {
          log(`No pageviews for team ${team.name} (${team.$id}) on ${yesterdayStr}`);
          continue;
        }

        // 3. Statisztikák számolása
        const uniqueIps = [...new Set(pageviews.documents.map(p => p.ipAddress))];
        const loggedInViews = pageviews.documents.filter(p => p.userId && p.userId.trim() !== '').length;

        // 4. daily_stats frissítése (vagy létrehozása)
        await databases.createDocument(
          '68fe32ea0008ab84b709',
          'daily_stats',
          ID.unique(),
          {
            teamId: team.$id,
            date: yesterdayStr,
            totalViews: pageviews.documents.length,
            uniqueVisitors: uniqueIps.length,
            loggedInViews: loggedInViews,
            teamName: team.name || team.nev // a mező neved szerint
          }
        );

        log(`✅ Processed team ${team.name || team.nev}: ${pageviews.documents.length} views, ${uniqueIps.length} unique visitors`);
        processedTeams++;
        totalViews += pageviews.documents.length;
        
      } catch (teamError) {
        error(`Error processing team ${team.$id}: ${teamError.message}`);
      }
    }

    return res.json({ 
      success: true, 
      message: 'Daily stats updated',
      summary: {
        date: yesterdayStr,
        processedTeams,
        totalViews,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (err) {
    error(`Function error: ${err.message}`);
    return res.json({ 
      success: false, 
      error: err.message,
      stack: err.stack 
    }, 500);
  }
};