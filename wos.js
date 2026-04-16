/**
 * Vercel Serverless Function — WOS API Proxy
 * CORS 문제 없이 브라우저에서 WOS API를 호출할 수 있도록 중계
 *
 * 엔드포인트:
 *   GET /api/wos?doi=10.1016/j.jallcom.2025.185431
 *
 * 환경변수 (Vercel 대시보드에서 설정):
 *   WOS_API_KEY = Clarivate WOS API Key
 */

export default async function handler(req, res) {
  // CORS 헤더 설정 — GitHub Pages에서 호출 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { doi } = req.query;
  if (!doi) {
    return res.status(400).json({ error: 'doi parameter required' });
  }

  const apiKey = process.env.WOS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'WOS_API_KEY not configured' });
  }

  try {
    // WOS API Expanded: DOI로 논문 검색
    const query = encodeURIComponent(`DO="${doi}"`);
    const url = `https://api.clarivate.com/apis/wos/v1/documents?db=WOS&q=${query}&limit=1`;

    const wosRes = await fetch(url, {
      headers: {
        'X-ApiKey': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!wosRes.ok) {
      const errText = await wosRes.text();
      return res.status(wosRes.status).json({
        error: `WOS API error: ${wosRes.status}`,
        detail: errText.slice(0, 200)
      });
    }

    const data = await wosRes.json();
    const docs = data.Data?.Records?.records?.REC || [];

    if (!docs.length) {
      return res.status(404).json({ error: 'Not found in WOS', doi });
    }

    const doc = docs[0];

    // 저자 정보 파싱
    const names = doc.static_data?.summary?.names?.name || [];
    const nameList = Array.isArray(names) ? names : [names];

    const authors = nameList.map(n => ({
      seq: n['@seq_no'],
      role: n['@role'],           // 'author'
      reprint: n['@reprint'],     // 'Y' = 교신저자
      lastName: n.last_name || '',
      firstName: n.first_name || '',
      fullName: n.full_name || '',
      displayName: n.display_name || '',
    }));

    // 교신저자 (reprint='Y')
    const corrAuthors = authors.filter(a => a.reprint === 'Y');

    // 발표일
    const pubInfo = doc.static_data?.summary?.pub_info || {};
    const pubYear = pubInfo['@pubyear'];
    const pubMonth = pubInfo['@pubmonth'];
    const coverDate = pubInfo.coverdate;

    // 학술지명
    const titles = doc.static_data?.summary?.titles?.title || [];
    const titleList = Array.isArray(titles) ? titles : [titles];
    const sourceTitle = titleList.find(t => t['@type'] === 'source')?.['#text'] || '';
    const articleTitle = titleList.find(t => t['@type'] === 'item')?.['#text'] || '';

    return res.status(200).json({
      doi,
      found: true,
      articleTitle,
      sourceTitle,
      pubYear,
      pubMonth,
      coverDate,
      authors,
      corrAuthors,
      totalAuthors: authors.length,
      hasCorrInfo: corrAuthors.length > 0,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
