"""serve.py -- LightHouse 入口服务：一个端口把入口页与四座训练场一起服务，页面关掉它自己退出。

原理：页面打开时挂一条 SSE 长连接（/__alive）。没有任何活连接持续 IDLE_GRACE 秒就退出，
所以刷新、跳转、在四座站之间来回切、开第二个标签页都不会误杀；最后一个页面关掉约 6 秒后窗口自动消失。

进入方式（为什么每轮换 URL）：run.bat 打开 http://127.0.0.1:端口/index.html?v=<每轮不同的令牌>。
浏览器把 URL 当缓存键，而 Windows 的 ShellExecute 遇到「已经开着的同一个 URL」时是把旧标签页切到前台、
不重新加载——用户于是看到上一轮的旧页面（旧 CSS，旧 app.js 里没有保活连接），同时表现为「排版没修好」
和「关掉浏览器窗口不关终端」。所以入口 URL 每轮都不同；直接访问 / 或任何 …/index.html 会 302 到带令牌的地址；
服务出去的每一份 HTML 里 assets/ content/ vendor/ 资源的 URL 也会被加上同一个令牌。
HTML 响应带 Clear-Site-Data: "cache"（不含 storage），练习进度不受影响。

四座训练场原来各有自己的 serve.py（单站启动用，仍在各自目录里）。这个根服务把四座站放在同一个源上，
于是入口页能读到各自的 localStorage 进度；各站 app.js 里检测「打开的是缓存旧版本」的逻辑靠 /__whoami，
本服务按请求的 Referer 认出它属于哪座站，回一个以那座站名开头的字符串，检测继续生效。

环境变量：
  LIGHTHOUSE_PORT       起始端口，默认 8876（被占用就往后找；四座站各自的是 8877-8880）
  LIGHTHOUSE_KEEP=1     永不因无连接退出（给自动化脚本用）
  LIGHTHOUSE_IDLE_GRACE 无连接多久后退出，默认 6 秒
  LIGHTHOUSE_NO_OPEN=1  不自动打开浏览器
  LIGHTHOUSE_TOKEN      指定令牌（测试用）
"""
import errno
import http.server
import os
import re
import secrets
import socket
import sys
import threading
import time
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
START_PORT = int(os.environ.get('LIGHTHOUSE_PORT', '8876'))
IDLE_GRACE = float(os.environ.get('LIGHTHOUSE_IDLE_GRACE', '6'))
KEEP_ALIVE_FOREVER = os.environ.get('LIGHTHOUSE_KEEP') == '1'
NO_OPEN = os.environ.get('LIGHTHOUSE_NO_OPEN') == '1'
TOKEN = os.environ.get('LIGHTHOUSE_TOKEN') or secrets.token_hex(3)

# 四座训练场的目录名，同时也是各自 serve.py 的 whoami 前缀
LAB_DIRS = ('html5-lab', 'css-lab', 'js-lab', 'ts-lab')

ASSET_RE = re.compile(rb'(src|href)="((?:assets|content|vendor)/[^"?#]+)"')

_clients = 0
_seen_client = False
_first_request_at = None
_hinted = False
_lock = threading.Lock()


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass  # 终端里只留启动那几行

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def redirect(self, location):
        self.send_response(302)
        self.send_header('Location', location)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        global _first_request_at
        with _lock:
            if _first_request_at is None:
                _first_request_at = time.time()

        path, _, query = self.path.partition('?')
        path = urllib.parse.unquote(path)

        if path == '/__alive':
            self.serve_alive()
            return
        if path == '/__whoami':
            self.send_plain(self.whoami())
            return
        if path in ('/', '/index.html'):
            if not query:
                # 没带令牌 → 跳一下，让浏览器拿到新 URL（绕开旧缓存与旧标签页）
                self.redirect('/index.html?v=' + TOKEN)
                return
            self.send_html('index.html')
            return

        if path.endswith('/'):
            # 目录请求：转到它自己的 index.html
            if os.path.isfile(self.to_file(path + 'index.html')):
                self.redirect(path + 'index.html?v=' + TOKEN)
                return
        elif path.endswith('/index.html') or path.endswith('.html'):
            # 训练场自己的页面：同样带上令牌，并把页面里的资源 URL 也打上令牌
            if path.endswith('/index.html') and not query:
                self.redirect(path + '?v=' + TOKEN)
                return
            rel = self.to_file(path)
            if os.path.isfile(rel):
                self.send_html(os.path.relpath(rel, ROOT).replace(os.sep, '/'))
                return

        super().do_GET()

    def whoami(self):
        """按 Referer 认出请求来自哪座训练场，让各站自己的「旧缓存」检测继续生效。"""
        ref = self.headers.get('Referer') or ''
        ref_path = urllib.parse.urlparse(ref).path
        for lab in LAB_DIRS:
            if ref_path.startswith('/' + lab + '/'):
                return '%s serve.py (LightHouse 入口服务)' % lab
        return 'lighthouse serve.py token=%s' % TOKEN

    def to_file(self, url_path):
        """URL 路径 → 磁盘路径，并挡住越出项目目录的路径。"""
        rel = url_path.lstrip('/').replace('/', os.sep)
        full = os.path.normpath(os.path.join(ROOT, rel))
        if not full.startswith(ROOT + os.sep) and full != ROOT:
            return os.path.join(ROOT, '__denied__')
        return full

    def send_plain(self, text):
        body = text.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_html(self, rel_path):
        """发一份 HTML，并把本地资源的 URL 都打上本轮令牌。"""
        with open(os.path.join(ROOT, rel_path), 'rb') as f:
            body = f.read()
        token = TOKEN.encode()
        body = ASSET_RE.sub(lambda m: b'%s="%s?v=%s"' % (m.group(1), m.group(2), token), body)

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        # 顺手清掉本站源上可能存在的旧缓存（不含 storage，练习进度不会被清）
        self.send_header('Clear-Site-Data', '"cache"')
        self.end_headers()
        self.wfile.write(body)

    def serve_alive(self):
        """SSE 长连接：连着就算页面活着，断开就减一。"""
        global _clients, _seen_client
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
        self.end_headers()
        with _lock:
            _clients += 1
            _seen_client = True
        try:
            while True:
                self.wfile.write(b': alive\n\n')
                self.wfile.flush()
                time.sleep(2)
        except Exception:
            pass
        finally:
            with _lock:
                _clients -= 1


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    # Windows 上 allow_reuse_address=True 会让「端口被占用」检测失效（两个服务能绑同一端口），
    # 所以关掉它，改用先探测再绑定的办法。
    allow_reuse_address = False


def port_has_listener(port):
    s = socket.socket()
    s.settimeout(0.3)
    try:
        s.connect(('127.0.0.1', port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def bind(start, tries=20):
    for port in range(start, start + tries):
        if port_has_listener(port):
            continue
        try:
            return Server(('127.0.0.1', port), Handler), port
        except OSError as e:
            if e.errno not in (errno.EADDRINUSE, 10048):
                raise
    raise SystemExit('[lighthouse] %d 起的 %d 个端口都被占用了，先关掉别的服务。' % (start, tries))


def open_browser(url):
    try:
        os.startfile(url)  # Windows：ShellExecute，不经过 python 的子进程环境
        return
    except Exception:
        pass
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception:
        pass


def watchdog():
    """只在见过第一个页面之后才计时，免得浏览器还没打开就自己退了。"""
    global _hinted
    idle = 0
    while True:
        time.sleep(1)

        with _lock:
            busy = _clients > 0 or not _seen_client
            need_hint = (not _hinted) and (not _seen_client)
            waited = (time.time() - _first_request_at) if _first_request_at else 0

        if need_hint and waited > 15:
            with _lock:
                _hinted = True
            print('[lighthouse] 拿到页面请求但没等到保活连接：这个页面可能是缓存里的旧版本。')
            print('[lighthouse] 在页面里按 Ctrl+Shift+R 强制刷新一次，窗口就能跟着页面一起关。')
            sys.stdout.flush()

        idle = 0 if busy else idle + 1
        if idle >= IDLE_GRACE:
            with _lock:
                if _clients > 0:
                    idle = 0
                    continue
            print('[lighthouse] 页面已关闭，服务退出。')
            sys.stdout.flush()
            os._exit(0)


def main():
    httpd, port = bind(START_PORT)
    url = 'http://127.0.0.1:%d/index.html?v=%s' % (port, TOKEN)
    print('[lighthouse] %s' % url)
    print('[lighthouse] 四座训练场都在这个端口下：/html5-lab/ /css-lab/ /js-lab/ /ts-lab/')
    print('[lighthouse] 关掉浏览器里的这个页面，本窗口会自动关闭（想立刻关掉本窗口也可以，只是再刷新会失败）。')
    sys.stdout.flush()

    if not NO_OPEN:
        threading.Timer(0.3, lambda: open_browser(url)).start()
    if not KEEP_ALIVE_FOREVER:
        threading.Thread(target=watchdog, daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('[lighthouse] 手动停止。')


if __name__ == '__main__':
    main()
