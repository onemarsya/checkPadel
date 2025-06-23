const fetch = require('node-fetch');

async function fetchDayData() {
  const url = 'https://simplifica.madeira.gov.pt/api/resources/intervals';
  const payload = {
    resourceId: '127',
    year: 2025,
    month: 6,
    day: 32,
    processId: 32
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://simplifica.madeira.gov.pt',
        'Referer': 'https://simplifica.madeira.gov.pt/services/3-53-102',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'Cookie': 'XSRF-TOKEN=eyJpdiI6Ik1qZGkwNm9aa2Flczl3ZHREQndqTFE9PSIsInZhbHVlIjoiaVl1MnIrOXdpb25NMTFGbHVMZ1kvNlg3dHB6eWkwcVBaVFR6TW42dCtyRUlpUGJ4ZGNuTnJ2bm9ydUNlTFZybk9xd1l4WlgrMlNJWmo5d3JnR2swSmR5ejU3RnVUaHFFUmNxdGVjZXJHQ2Iwd1E3ekVRWXZDVFRuaXlSSnJJemYiLCJtYWMiOiI5MjFhMThmZWUyMWQ4ZTZkM2IzMDBjZmU4MGEzMGY1ODUzODU0ZjA2N2E3ZjQwYzYyMmNmYmRhOTU0ZjU1Y2Q3IiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6Im9IT3B0elRzWE1SNmRVa1B4dlR2WUE9PSIsInZhbHVlIjoiTmIyNWVNVDJGZzZHSTVtY3BHekc1bzFLS0F4NFpvZ080aFJxWVRMcDVZQ09EL2orVzBLL3FsVWlNUXNJNU5xOUJlQzMzMXdVME9xQlVjSHR6SXdablY3LytJRFhHRFo4NlpTeE9La1ZvRHJscnVRU2xrd2JTZEpkSzlUS0VOaVciLCJtYWMiOiIzZTU5ZWJiYWM4OTIwMmI3ODM2OWM0NjNiY2UzZDkwNDdjZTVmZDNiZWYyMThlNTNhNTNiMTFkNDI1ZTk3NTMyIiwidGFnIjoiIn0%3D',
        'x-xsrf-token': 'eyJpdiI6Ik1qZGkwNm9aa2Flczl3ZHREQndqTFE9PSIsInZhbHVlIjoiaVl1MnIrOXdpb25NMTFGbHVMZ1kvNlg3dHB6eWkwcVBaVFR6TW42dCtyRUlpUGJ4ZGNuTnJ2bm9ydUNlTFZybk9xd1l4WlgrMlNJWmo5d3JnR2swSmR5ejU3RnVUaHFFUmNxdGVjZXJHQ2Iwd1E3ekVRWXZDVFRuaXlSSnJJemYiLCJtYWMiOiI5MjFhMThmZWUyMWQ4ZTZkM2IzMDBjZmU4MGEzMGY1ODUzODU0ZjA2N2E3ZjQwYzYyMmNmYmRhOTU0ZjU1Y2Q3IiwidGFnIjoiIn0=',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }

    const data = await response.json();
    console.log('Ответ:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Ошибка при запросе:', err);
  }
}

fetchDayData();
