#!/usr/bin/env node

/**
 * نص برمجي لاختبار ملفات تعريف الارتباط لـ YouTube
 * يتحقق من وجود ملف cookies ويختبر عمله مع yt-dlp و ytdl-core
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

class YouTubeCookiesTester {
    constructor() {
        this.cookiesPath = path.join(__dirname, 'cookies', 'youtube.txt');
        this.testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll للاختبار
    }

    async runTests() {
        console.log('🧪 بدء اختبار ملفات تعريف الارتباط لـ YouTube\n');
        console.log('=' .repeat(50));

        // اختبار 1: فحص وجود ملف cookies
        await this.testCookiesFile();
        
        // اختبار 2: فحص تنسيق ملف cookies
        await this.testCookiesFormat();
        
        // اختبار 3: اختبار yt-dlp مع cookies
        await this.testYtDlpWithCookies();
        
        // اختبار 4: اختبار ytdl-core مع cookies
        await this.testYtdlCoreWithCookies();
        
        console.log('\n' + '=' .repeat(50));
        console.log('✅ انتهى الاختبار!');
        this.printRecommendations();
    }

    async testCookiesFile() {
        console.log('\n📁 اختبار 1: فحص وجود ملف cookies');
        console.log('-' .repeat(30));
        
        try {
            if (fs.existsSync(this.cookiesPath)) {
                const stats = fs.statSync(this.cookiesPath);
                const sizeKB = (stats.size / 1024).toFixed(2);
                
                if (stats.size > 0) {
                    console.log('✅ ملف cookies موجود');
                    console.log(`📊 حجم الملف: ${sizeKB} KB`);
                    console.log(`📍 المسار: ${this.cookiesPath}`);
                    return true;
                } else {
                    console.log('⚠️  ملف cookies موجود لكنه فارغ');
                    return false;
                }
            } else {
                console.log('❌ ملف cookies غير موجود');
                console.log(`📍 المسار المتوقع: ${this.cookiesPath}`);
                return false;
            }
        } catch (error) {
            console.log('❌ خطأ في فحص ملف cookies:', error.message);
            return false;
        }
    }

    async testCookiesFormat() {
        console.log('\n🔍 اختبار 2: فحص تنسيق ملف cookies');
        console.log('-' .repeat(30));
        
        try {
            if (!fs.existsSync(this.cookiesPath)) {
                console.log('⏭️  تم تخطي الاختبار - ملف cookies غير موجود');
                return false;
            }

            const cookieData = fs.readFileSync(this.cookiesPath, 'utf8');
            const lines = cookieData.split('\n').filter(line => 
                line.trim() && !line.startsWith('#')
            );

            if (lines.length === 0) {
                console.log('⚠️  ملف cookies لا يحتوي على بيانات صالحة');
                return false;
            }

            let validCookies = 0;
            let youtubeCookies = 0;

            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length >= 7) {
                    validCookies++;
                    if (parts[0].includes('youtube.com') || parts[0].includes('.youtube.com')) {
                        youtubeCookies++;
                    }
                }
            }

            console.log(`✅ عدد cookies الصالحة: ${validCookies}`);
            console.log(`🎯 عدد cookies الخاصة بـ YouTube: ${youtubeCookies}`);
            
            if (youtubeCookies > 0) {
                console.log('✅ تنسيق ملف cookies صحيح');
                return true;
            } else {
                console.log('⚠️  لا توجد cookies خاصة بـ YouTube في الملف');
                return false;
            }
        } catch (error) {
            console.log('❌ خطأ في فحص تنسيق cookies:', error.message);
            return false;
        }
    }

    async testYtDlpWithCookies() {
        console.log('\n🚀 اختبار 3: اختبار yt-dlp مع cookies');
        console.log('-' .repeat(30));
        
        try {
            const args = [
                '--dump-json',
                '--no-playlist',
                '--no-warnings',
                '--quiet'
            ];

            if (fs.existsSync(this.cookiesPath)) {
                args.push('--cookies', this.cookiesPath);
                console.log('🍪 استخدام ملف cookies مع yt-dlp');
            } else {
                console.log('⚠️  اختبار yt-dlp بدون cookies');
            }

            args.push(this.testVideoUrl);

            console.log('⏳ جاري اختبار yt-dlp...');
            const { stdout } = await execFileAsync('yt-dlp', args, {
                timeout: 30000,
                maxBuffer: 1024 * 1024 * 5
            });

            const videoInfo = JSON.parse(stdout.trim());
            console.log('✅ yt-dlp يعمل بنجاح!');
            console.log(`📺 عنوان الفيديو: ${videoInfo.title}`);
            console.log(`👤 القناة: ${videoInfo.uploader}`);
            console.log(`⏱️  المدة: ${Math.floor(videoInfo.duration / 60)}:${(videoInfo.duration % 60).toString().padStart(2, '0')}`);
            return true;
        } catch (error) {
            console.log('❌ فشل اختبار yt-dlp:', error.message);
            
            if (error.message.includes('Sign in to confirm')) {
                console.log('🤖 تم اكتشاف خطأ "bot detection" - تحتاج إلى cookies صالحة');
            } else if (error.message.includes('yt-dlp')) {
                console.log('📦 تأكد من تثبيت yt-dlp بشكل صحيح');
            }
            return false;
        }
    }

    async testYtdlCoreWithCookies() {
        console.log('\n🔧 اختبار 4: اختبار ytdl-core مع cookies');
        console.log('-' .repeat(30));
        
        try {
            const ytdl = require('ytdl-core');
            
            const options = {
                quality: 'highest',
                filter: 'audioandvideo'
            };

            if (fs.existsSync(this.cookiesPath)) {
                const cookieData = fs.readFileSync(this.cookiesPath, 'utf8');
                const cookieHeader = this.parseCookiesFile(cookieData);
                
                if (cookieHeader) {
                    options.requestOptions = {
                        headers: {
                            'Cookie': cookieHeader
                        }
                    };
                    console.log('🍪 استخدام ملف cookies مع ytdl-core');
                } else {
                    console.log('⚠️  فشل في تحليل ملف cookies');
                }
            } else {
                console.log('⚠️  اختبار ytdl-core بدون cookies');
            }

            console.log('⏳ جاري اختبار ytdl-core...');
            const info = await ytdl.getInfo(this.testVideoUrl, options);
            
            console.log('✅ ytdl-core يعمل بنجاح!');
            console.log(`📺 عنوان الفيديو: ${info.videoDetails.title}`);
            console.log(`👤 القناة: ${info.videoDetails.author.name}`);
            console.log(`👀 المشاهدات: ${parseInt(info.videoDetails.viewCount).toLocaleString()}`);
            return true;
        } catch (error) {
            console.log('❌ فشل اختبار ytdl-core:', error.message);
            
            if (error.message.includes('Sign in to confirm')) {
                console.log('🤖 تم اكتشاف خطأ "bot detection" - تحتاج إلى cookies صالحة');
            }
            return false;
        }
    }

    parseCookiesFile(cookieData) {
        try {
            const lines = cookieData.split('\n');
            const cookies = [];

            for (const line of lines) {
                if (line.startsWith('#') || !line.trim()) continue;
                
                const parts = line.split('\t');
                if (parts.length >= 7) {
                    const name = parts[5]?.trim();
                    const value = parts[6]?.trim();
                    
                    // تنظيف الاسم والقيمة من الأحرف غير الصالحة
                    if (name && value && this.isValidCookiePart(name) && this.isValidCookiePart(value)) {
                        cookies.push(`${name}=${value}`);
                    }
                }
            }

            const cookieHeader = cookies.join('; ');
            
            // التحقق من صحة header النهائي
            if (this.isValidCookieHeader(cookieHeader)) {
                return cookieHeader;
            } else {
                console.log('⚠️  تم تنظيف cookies header من الأحرف غير الصالحة');
                return this.sanitizeCookieHeader(cookieHeader);
            }
        } catch (error) {
            console.log('❌ خطأ في تحليل ملف cookies:', error.message);
            return null;
        }
    }

    isValidCookiePart(str) {
        // التحقق من عدم وجود أحرف تحكم أو أحرف غير صالحة
        return !/[\x00-\x1F\x7F-\x9F]/.test(str);
    }

    isValidCookieHeader(header) {
        // التحقق من صحة Cookie header
        return !/[\x00-\x1F\x7F-\x9F]/.test(header);
    }

    sanitizeCookieHeader(header) {
        // إزالة الأحرف غير الصالحة
        return header.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
    }

    printRecommendations() {
        console.log('\n💡 التوصيات:');
        console.log('-' .repeat(20));
        
        if (!fs.existsSync(this.cookiesPath)) {
            console.log('1. 📥 قم بتصدير ملف cookies من متصفحك');
            console.log('2. 📁 ضع الملف في مجلد cookies/ باسم youtube.txt');
            console.log('3. 🔄 أعد تشغيل الاختبار');
        } else {
            console.log('1. ✅ ملف cookies موجود');
            console.log('2. 🔄 إذا كنت تواجه مشاكل، جرب تصدير cookies جديدة');
            console.log('3. 🚀 يمكنك الآن استخدام التطبيق بدون مشاكل bot detection');
        }
        
        console.log('\n🔗 للمساعدة الإضافية، راجع ملف YOUTUBE-COOKIES-GUIDE-ARABIC.md');
    }
}

// تشغيل الاختبار
if (require.main === module) {
    const tester = new YouTubeCookiesTester();
    tester.runTests().catch(error => {
        console.error('❌ خطأ في تشغيل الاختبار:', error.message);
        process.exit(1);
    });
}

module.exports = YouTubeCookiesTester;