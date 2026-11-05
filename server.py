# -*- coding: utf-8 -*-
"""
السيرفر المحلي لمنصة أعضاء جسم الإنسان التفاعلية 3D
الميزات:
1. يتيح تشغيل فيديوهات يوتيوب مباشرة داخل الموقع دون ظهور Error 153.
2. يوفر حفظاً تلقائياً ودائماً لأي رابط يوتيوب أو سؤال يُعدله الأدمن مباشرة في ملف content.js على القرص الصلب.
3. يفتح المتصفح تلقائياً فور التشغيل.
"""

import http.server
import socketserver
import os
import sys
import json
import webbrowser
import threading
import time

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class LocalAppHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'mode': 'local_server'}, ensure_ascii=False).encode('utf-8'))
            return
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/save_content':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                post_body = self.rfile.read(content_len).decode('utf-8')
                data = json.loads(post_body)
                
                # Format content.js
                content_js_path = os.path.join(DIRECTORY, 'content.js')
                formatted_json = json.dumps(data, ensure_ascii=False, indent=2)
                file_content = f"// ملف المحتوى المنشور للجميع - يُحدّث تلقائياً وبشكل دائم من لوحة الإدارة\nwindow.PUBLISHED_CONTENT = {formatted_json};\n"
                
                with open(content_js_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'message': 'تم حفظ وتثبيت التعديلات نهائياً على القرص في ملف content.js!'
                }, ensure_ascii=False).encode('utf-8'))
                print(f"[SAVE] تم حفظ التعديلات نهائياً في content.js بنجاح!")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
                print(f"[ERROR] خطأ أثناء الحفظ: {e}")
            return
        
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def open_browser(port):
    time.sleep(1.2)
    url = f"http://localhost:{port}/index.html"
    print(f"\n==================================================")
    print(f"🚀 المنصة جاهزة وتعمل الآن عبر الرابط:")
    print(f"   {url}")
    print(f"🎥 جميع فيديوهات يوتيوب تعمل الآن داخلياً 100%")
    print(f"💾 أي تعديل على الروابط أو الأسئلة يُحفظ تلقائياً على القرص")
    print(f"==================================================\n")
    webbrowser.open(url)

def main():
    global PORT
    for try_port in [8000, 8080, 8888, 9000, 5000]:
        try:
            server = socketserver.TCPServer(('127.0.0.1', try_port), LocalAppHandler)
            PORT = try_port
            break
        except OSError:
            continue
    
    threading.Thread(target=open_browser, args=(PORT,), daemon=True).start()
    try:
        print(f"بدء تشغيل السيرفر على http://localhost:{PORT} ... (اضغط Ctrl+C للإيقاف)")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nتم إيقاف السيرفر بنجاح.")
        server.server_close()

if __name__ == '__main__':
    main()
