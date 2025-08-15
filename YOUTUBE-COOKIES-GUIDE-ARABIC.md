# دليل إضافة ملفات تعريف الارتباط (Cookies) لحل خطأ YouTube "Sign in to confirm you're not a bot"

## 🎯 المشكلة
تواجه خطأ: `Sign in to confirm you're not a bot` عند محاولة استخراج معلومات فيديو من YouTube باستخدام yt-dlp أو ytdl-core على خادم Render.

## 🔧 الحل الكامل خطوة بخطوة

### الخطوة 1: تصدير ملف Cookies من المتصفح

#### طريقة 1: استخدام إضافة المتصفح (الأسهل)
1. **لمتصفح Chrome:**
   - اذهب إلى [Chrome Web Store](https://chrome.google.com/webstore)
   - ابحث عن "Get cookies.txt LOCALLY"
   - اضغط "Add to Chrome" لتثبيت الإضافة

2. **لمتصفح Firefox:**
   - اذهب إلى [Firefox Add-ons](https://addons.mozilla.org)
   - ابحث عن "cookies.txt"
   - ثبت إضافة "cookies.txt"

3. **تصدير الـ Cookies:**
   - اذهب إلى [YouTube.com](https://youtube.com)
   - تأكد من تسجيل الدخول إلى حسابك
   - اضغط على أيقونة الإضافة في شريط الأدوات
   - اختر "Export" أو "Download"
   - احفظ الملف باسم `youtube.txt`

#### طريقة 2: استخدام أدوات المطور (للمتقدمين)
1. اذهب إلى YouTube.com وسجل الدخول
2. اضغط F12 لفتح أدوات المطور
3. اذهب إلى تبويب "Application" أو "Storage"
4. اختر "Cookies" ثم "https://youtube.com"
5. انسخ جميع الـ cookies وأنشئ ملف `youtube.txt` بالتنسيق المطلوب

### الخطوة 2: إضافة ملف Cookies إلى مشروعك

1. **إنشاء مجلد cookies:**
   ```bash
   mkdir cookies
   ```

2. **نسخ ملف youtube.txt:**
   - ضع ملف `youtube.txt` الذي صدرته في مجلد `cookies/`
   - المسار النهائي: `cookies/youtube.txt`

3. **تحديث .gitignore:**
   تأكد من أن ملف `.gitignore` يحتوي على:
   ```
   cookies/*.txt
   cookies/
   *.cookies
   ```

### الخطوة 3: تعديل ytdlpManager.js

سيتم تحديث ملف `ytdlpManager.js` ليدعم ملفات تعريف الارتباط:

```javascript
const path = require('path');
const fs = require('fs');

class YtDlpManager {
    constructor() {
        this.cookiesPath = path.join(__dirname, '..', 'cookies', 'youtube.txt');
        this.cookiesExist = this.checkCookiesFile();
    }

    checkCookiesFile() {
        try {
            return fs.existsSync(this.cookiesPath) && fs.statSync(this.cookiesPath).size > 0;
        } catch (error) {
            console.log('⚠️ Cookies file check failed:', error.message);
            return false;
        }
    }

    async getVideoInfo(url) {
        try {
            // محاولة yt-dlp أولاً
            const ytDlpResult = await this.tryYtDlp(url);
            if (ytDlpResult) return ytDlpResult;

            // إذا فشل yt-dlp، جرب ytdl-core
            console.log('🔄 yt-dlp failed, trying ytdl-core fallback...');
            return await this.tryYtdlCore(url);
        } catch (error) {
            throw new Error(`Both yt-dlp and ytdl-core failed: ${error.message}`);
        }
    }

    async tryYtDlp(url) {
        const { execFile } = require('child_process');
        const { promisify } = require('util');
        const execFileAsync = promisify(execFile);

        try {
            const args = [
                '--dump-json',
                '--no-playlist',
                '--no-warnings'
            ];

            // إضافة cookies إذا كانت متوفرة
            if (this.cookiesExist) {
                args.push('--cookies', this.cookiesPath);
                console.log('🍪 Using cookies for yt-dlp');
            }

            args.push(url);

            const { stdout } = await execFileAsync('yt-dlp', args, {
                timeout: 30000,
                maxBuffer: 1024 * 1024 * 10
            });

            return JSON.parse(stdout.trim());
        } catch (error) {
            console.log('❌ yt-dlp failed:', error.message);
            return null;
        }
    }

    async tryYtdlCore(url) {
        const ytdl = require('ytdl-core');

        try {
            const options = {
                quality: 'highest',
                filter: 'audioandvideo'
            };

            // إضافة cookies لـ ytdl-core إذا كانت متوفرة
            if (this.cookiesExist) {
                const cookieData = fs.readFileSync(this.cookiesPath, 'utf8');
                options.requestOptions = {
                    headers: {
                        'Cookie': this.parseCookiesFile(cookieData)
                    }
                };
                console.log('🍪 Using cookies for ytdl-core');
            }

            const info = await ytdl.getInfo(url, options);
            return this.formatYtdlCoreResponse(info);
        } catch (error) {
            console.log('❌ ytdl-core failed:', error.message);
            throw error;
        }
    }

    parseCookiesFile(cookieData) {
        // تحويل ملف cookies.txt إلى تنسيق Cookie header
        const lines = cookieData.split('\n');
        const cookies = [];

        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;
            
            const parts = line.split('\t');
            if (parts.length >= 7) {
                const name = parts[5];
                const value = parts[6];
                cookies.push(`${name}=${value}`);
            }
        }

        return cookies.join('; ');
    }

    formatYtdlCoreResponse(info) {
        return {
            id: info.videoDetails.videoId,
            title: info.videoDetails.title,
            duration: parseInt(info.videoDetails.lengthSeconds),
            view_count: parseInt(info.videoDetails.viewCount),
            uploader: info.videoDetails.author.name,
            upload_date: info.videoDetails.publishDate,
            thumbnail: info.videoDetails.thumbnails[0]?.url,
            formats: info.formats.map(format => ({
                format_id: format.itag,
                ext: format.container,
                quality: format.qualityLabel,
                url: format.url
            }))
        };
    }
}

module.exports = YtDlpManager;
```

### الخطوة 4: إعدادات Render

#### 4.1 متغيرات البيئة
في لوحة تحكم Render، أضف المتغيرات التالية:
```
NODE_ENV=production
YT_DLP_COOKIES_PATH=/opt/render/project/src/cookies/youtube.txt
```

#### 4.2 تحديث Build Command
في إعدادات Render:
```bash
npm install && npm run build
```

#### 4.3 تحديث Start Command
```bash
node server-render.js
```

### الخطوة 5: رفع التحديثات إلى Git

```bash
# إضافة الملفات المحدثة
git add .

# إنشاء commit
git commit -m "Add YouTube cookies support for bot detection fix"

# رفع إلى GitHub
git push origin main
```

**⚠️ تحذير مهم:** لا ترفع ملف `cookies/youtube.txt` إلى Git لأسباب أمنية!

### الخطوة 6: اختبار الحل

1. **اختبار محلي:**
   ```bash
   npm run test-cookies
   ```

2. **اختبار على Render:**
   - انتظر حتى ينتهي deployment
   - جرب تنزيل فيديو من YouTube
   - تحقق من logs في Render Dashboard

## 🔒 نصائح الأمان

1. **لا تشارك ملف cookies.txt مع أحد**
2. **غير كلمة مرور YouTube بانتظام**
3. **احذف ملف cookies.txt من جهازك بعد رفعه**
4. **استخدم حساب YouTube منفصل للتطبيق**

## 🚨 استكشاف الأخطاء

### خطأ: "Cookies file not found"
- تأكد من وجود ملف `cookies/youtube.txt`
- تحقق من المسار في الكود

### خطأ: "Invalid cookies format"
- تأكد من تصدير cookies بالتنسيق الصحيح
- جرب إعادة تصدير cookies من المتصفح

### خطأ: "Still getting bot detection"
- جرب تسجيل الدخول إلى YouTube من IP مختلف
- احذف cookies القديمة وصدر جديدة
- تأكد من أن حسابك ليس محظوراً

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs في Render Dashboard
2. جرب الاختبار المحلي أولاً
3. تأكد من صحة ملف cookies.txt

---

**✅ بعد تطبيق هذه الخطوات، ستتمكن من تنزيل فيديوهات YouTube بدون خطأ "Sign in to confirm you're not a bot"!**