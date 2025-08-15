# حل مشكلة yt-dlp في بيئة Render.com

## المشكلة

عند تشغيل التطبيق في بيئة Render.com، قد تظهر الأخطاء التالية:

```
❌ Failed to spawn yt-dlp process: spawn yt-dlp ENOENT
❌ Error getting video info: yt-dlp executable not found at path: yt-dlp. Please ensure yt-dlp is installed and accessible.
```

هذه الأخطاء تشير إلى أن التطبيق لا يستطيع العثور على برنامج yt-dlp في مسار النظام (PATH)، على الرغم من تثبيته في مرحلة البناء.

## السبب

هناك عدة أسباب محتملة لهذه المشكلة:

1. **مسار التثبيت**: يتم تثبيت yt-dlp في مجلد المستخدم (`$HOME/.local/bin`) ولكن هذا المسار قد لا يكون مضافًا إلى متغير PATH أثناء تشغيل التطبيق.
2. **صلاحيات التنفيذ**: قد لا تكون هناك صلاحيات كافية لتنفيذ yt-dlp.
3. **اختلاف البيئة**: البيئة التي يتم فيها تثبيت yt-dlp (أثناء البناء) قد تختلف عن البيئة التي يتم فيها تشغيل التطبيق.

## الحل

تم تنفيذ الإصلاحات التالية لحل المشكلة:

### 1. تحديث ملف render.yaml

- إضافة متغير PATH إلى متغيرات البيئة لضمان توفر yt-dlp في مسار النظام:

```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: PORT
    fromService:
      type: web
      name: video-downloader
      property: port
  - key: PATH
    value: "$HOME/.local/bin:$PATH"
  - key: RENDER
    value: "true"
```

- تحسين أمر preDeployCommand لتثبيت yt-dlp والتحقق من التثبيت:

```yaml
preDeployCommand: |
  echo "Installing yt-dlp for Render.com..."
  python3 -m pip install --user --upgrade yt-dlp
  export PATH="$HOME/.local/bin:$PATH"
  echo "PATH after update: $PATH"
  echo "Checking yt-dlp installation..."
  which yt-dlp || echo "yt-dlp not found in PATH"
  ls -la $HOME/.local/bin/ | grep yt-dlp || echo "yt-dlp not found in .local/bin"
  if command -v yt-dlp >/dev/null 2>&1; then
    echo "✅ yt-dlp version: $(yt-dlp --version)"
  else
    echo "❌ yt-dlp installation failed"
    exit 1
  fi
```

### 2. تحسين كود ytdlpManager.js

- إضافة تحقق أفضل من وجود yt-dlp في بيئة Render.com:

```javascript
else if (process.env.RENDER) {
  // In Render.com, try common paths where pip installs yt-dlp
  const renderPaths = [
    process.env.HOME + '/.local/bin/yt-dlp',
    '/opt/render/.local/bin/yt-dlp',
    '/home/render/.local/bin/yt-dlp',
    'yt-dlp'
  ];
  
  console.log('🔍 Render.com environment detected, checking yt-dlp paths...');
  console.log('📍 HOME directory:', process.env.HOME);
  console.log('📍 PATH environment:', process.env.PATH);
  
  ytdlpPath = 'yt-dlp'; // Default fallback
  for (const renderPath of renderPaths) {
    console.log(`🔍 Checking path: ${renderPath}`);
    if (renderPath !== 'yt-dlp' && fs.existsSync(renderPath)) {
      ytdlpPath = renderPath;
      console.log(`✅ Found yt-dlp for Render.com at: ${renderPath}`);
      break;
    }
  }
  
  if (ytdlpPath === 'yt-dlp') {
    console.log('🔧 Using system yt-dlp for Render.com (PATH-based)');
    console.log('⚠️ If this fails, check that yt-dlp is properly installed and in PATH');
  }
}
```

## كيفية التحقق من الحل

بعد نشر التطبيق على Render.com، يمكنك التحقق من الحل بالطرق التالية:

1. **فحص سجلات البناء**: تأكد من أن yt-dlp تم تثبيته بنجاح وأن الأمر `yt-dlp --version` يعمل.

2. **فحص سجلات التشغيل**: ابحث عن رسائل مثل:
   - `🔍 Render.com environment detected, checking yt-dlp paths...`
   - `✅ Found yt-dlp for Render.com at: [path]`

3. **اختبار API**: قم باختبار نقطة نهاية استخراج معلومات الفيديو باستخدام رابط Twitter:
   ```
   curl "https://your-app-name.onrender.com/api/video-info?url=https://x.com/i/status/1955649791175581774"
   ```

## ملاحظات إضافية

- إذا استمرت المشكلة، يمكنك تجربة تثبيت yt-dlp عالميًا باستخدام `pip install -g yt-dlp` في preDeployCommand.
- تأكد من أن لديك Python 3 وpip مثبتين ومتاحين في بيئة Render.com.
- قد تحتاج إلى تعديل صلاحيات ملف yt-dlp باستخدام `chmod +x $HOME/.local/bin/yt-dlp` في preDeployCommand.

## المراجع

- [توثيق Render.com حول متغيرات البيئة](https://render.com/docs/environment-variables)
- [توثيق yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)