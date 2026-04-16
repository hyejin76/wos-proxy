# WOS API Proxy (Vercel)

Web of Science API를 브라우저에서 직접 호출할 수 없는 CORS 문제를 해결하는 프록시 서버입니다.

## 배포 방법

### 1. GitHub 저장소 생성
```bash
git init
git add .
git commit -m "init: WOS proxy"
git remote add origin https://github.com/YOUR_USERNAME/wos-proxy.git
git push -u origin main
```

### 2. Vercel 배포
1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub 저장소 `wos-proxy` 선택 → **Deploy**
3. 배포 완료 후 URL 확인 (예: `https://wos-proxy-xxx.vercel.app`)

### 3. 환경변수 설정 (중요!)
Vercel 대시보드 → Project → **Settings** → **Environment Variables**
- Key: `WOS_API_KEY`
- Value: Clarivate에서 발급받은 API Key
- **Save** 클릭 후 **Redeploy**

### 4. 검증 페이지에 프록시 URL 등록
검증 페이지 ⚙ 설정 → WOS 프록시 URL 입력:
```
https://wos-proxy-xxx.vercel.app
```

## API 사용법

```
GET https://wos-proxy-xxx.vercel.app/api/wos?doi=10.1016/j.jallcom.2025.185431
```

### 응답 예시
```json
{
  "doi": "10.1016/j.jallcom.2025.185431",
  "found": true,
  "articleTitle": "Magnetocaloric properties...",
  "sourceTitle": "JOURNAL OF ALLOYS AND COMPOUNDS",
  "pubYear": "2025",
  "authors": [
    { "seq": "1", "reprint": "N", "lastName": "Kim", "firstName": "Jihwan" },
    { "seq": "5", "reprint": "Y", "lastName": "Yoon", "firstName": "Chong Seung" }
  ],
  "corrAuthors": [
    { "seq": "5", "reprint": "Y", "lastName": "Yoon", "firstName": "Chong Seung" }
  ],
  "totalAuthors": 5
}
```

`reprint: "Y"` = 교신저자
