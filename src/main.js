import { Client, Databases, Functions } from "../js/lib/appwrite.js";

export default async ({ req, res, log, error }) => {
  // CORS headers beállítása
  res.headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  // Preflight request kezelése
  if (req.method === 'OPTIONS') {
    return res.empty();
  }

  // Csak POST kérések engedélyezése
  if (req.method !== 'POST') {
    return res.json({ error: 'Method not allowed' }, 405);
  }

  try {
    // Környezeti változók
    const {
      APPWRITE_FUNCTION_ENDPOINT,
      APPWRITE_FUNCTION_PROJECT_ID,
      APPWRITE_FUNCTION_API_KEY,
    } = process.env;

    // Appwrite client inicializálás
    const client = new Client()
      .setEndpoint(APPWRITE_FUNCTION_ENDPOINT)
      .setProject(APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(APPWRITE_FUNCTION_API_KEY);

    const databases = new Databases(client);

    // Request body parse
    const data = JSON.parse(req.body || '{}');
    const { teamId, timestamp, userAgent, screenSize } = data;

    // Validáció
    if (!teamId) {
      return res.json({ error: 'teamId is required' }, 400);
    }

    // Ellenőrizzük, hogy létezik-e a csapat
    try {
      await databases.getDocument(
        '68fe32ea0008ab84b709', // Database ID
        'csapatok',             // Collection ID
        teamId
      );
    } catch (err) {
      return res.json({ error: 'Team not found' }, 404);
    }

    // IP cím anonymizálása
    const anonymizeIP = (ip) => {
      if (!ip) return 'unknown';
      // Távolítsuk el az utolsó 2 octetet: 192.168.1.100 → 192.168.XXX.XXX
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.XXX.XXX`;
      }
      return ip;
    };

    const userIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   'unknown';
    const anonymizedIP = anonymizeIP(userIP);

    // Mai dátum
    const today = new Date().toISOString().split('T')[0];

    // Duplikáció ellenőrzése (ugyanaz a user, ugyanazon a napon)
    const existingViews = await databases.listDocuments(
      '68fe32ea0008ab84b709', // Database ID
      'pageviews',            // Collection ID (létre kell hozni!)
      [
        databases.Query.equal('teamId', teamId),
        databases.Query.equal('date', today),
        databases.Query.equal('anonymizedIP', anonymizedIP),
        databases.Query.limit(1)
      ]
    );

    // Ha már volt ma kattintás ettől a felhasználótól, nem mentjük újra
    if (existingViews.total > 0) {
      return res.json({ 
        success: true, 
        message: 'Already tracked today',
        duplicate: true 
      }, 200);
    }

    // Új pageview mentése
    const pageView = await databases.createDocument(
      '68fe32ea0008ab84b709', // Database ID
      'pageviews',            // Collection ID
      'unique()',             // Document ID (auto-generált)
      {
        teamId: teamId,
        date: today,
        timestamp: new Date().toISOString(),
        anonymizedIP: anonymizedIP,
        userAgent: userAgent || 'unknown',
        screenSize: screenSize || 'unknown',
        userAgentData: JSON.stringify({
          browser: req.headers['sec-ch-ua'] || 'unknown',
          platform: req.headers['sec-ch-ua-platform'] || 'unknown',
          mobile: req.headers['sec-ch-ua-mobile'] || 'unknown'
        })
      }
    );

    log(`Pageview tracked for team ${teamId}`);

    return res.json({
      success: true,
      message: 'Pageview tracked successfully',
      viewId: pageView.$id
    }, 201);

  } catch (err) {
    error('Tracking error: ' + err.message);
    return res.json({ 
      error: 'Internal server error',
      details: err.message 
    }, 500);
  }
};