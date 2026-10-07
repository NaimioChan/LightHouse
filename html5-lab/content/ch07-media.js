/* ch07 — 音频与视频 */
(function (root) {
  (root.H5LAB_CHAPTERS || (root.H5LAB_CHAPTERS = [])).push({
    id: 'ch07',
    title: '第 7 章 · 音频与视频',
    goal: '写出带播放控件、多个来源、封面与字幕的音视频标签，并给认不出这些标签的浏览器留一行说明。',
    sections: [
      {
        kind: 'prose',
        md: [
          '## 两个标签：`audio` 与 `video`',
          '',
          '`<audio>` 放声音，`<video>` 放画面。两者都靠 `controls` 属性让浏览器画出自己的播放条：播放、暂停、进度、音量。',
          '不写 `controls` 的媒体元素在页面上什么都看不见——`audio` 完全不占位置，`video` 只剩一块黑框，用户没有按钮可点。',
          '',
          '标签里面的那行文字是兜底内容：浏览器认不出这个标签时才会显示。现在的浏览器都认得，但那行字仍然是唯一的提示。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '一段带控件的音频',
        height: 130,
        html: [
          '<audio controls>',
          '  你的浏览器不支持 audio 元素，点这里下载这段音频。',
          '</audio>'
        ].join('\n'),
        checks: [
          'has("audio", "页面里要有 audio")',
          'has("audio[controls]", "audio 要带 controls，否则看不到播放条")',
          'eq(text("audio"), "你的浏览器不支持 audio 元素，点这里下载这段音频。", "标签里的兜底文字")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## 一个来源不够，就写 `source`',
          '',
          '`src` 写在标签上时只能给一个地址，浏览器不认这个格式就直接放弃。把地址挪进 `source`，就能一次给好几个：',
          '',
          '- `src` 文件地址',
          '- `type` 媒体类型，让浏览器跳过自己不认的格式，不用先下载再后悔',
          '',
          '`<source>` 是 `video` / `audio` 的子元素，写在兜底文字前面。位于标签属性上的 `src` 只有一个，标签里的 `source` 可以有多个。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '两套格式，一份视频',
        height: 220,
        html: [
          '<video controls width="320" height="180">',
          '  <source src="intro.mp4" type="video/mp4">',
          '  <source src="intro.webm" type="video/webm">',
          '  你的浏览器不支持 video 元素。',
          '</video>'
        ].join('\n'),
        checks: [
          'count("video > source", 2, "两个来源")',
          'eq(attr("video source", "type"), "video/mp4", "第一个来源是 mp4")',
          'eq(attr("video", "width"), "320", "video 的 width 属性")',
          'has("video[controls]", "video 带 controls")'
        ]
      },
      {
        kind: 'table',
        code: true,
        head: ['属性 / 标签', '管什么'],
        rows: [
          ['controls', '画出浏览器自带的播放条'],
          ['src', '单个媒体地址，只能给一个'],
          ['source', '写在标签里，给多个地址与格式，按顺序挑'],
          ['preload', 'none / metadata / auto，页面打开时预先取多少'],
          ['loop', '放完从头再来'],
          ['muted', '默认静音'],
          ['poster', '仅 video：还没开始播放时显示的封面图'],
          ['width / height', '仅 video：视频区的像素尺寸'],
          ['track', '字幕、章节、说明的轨道']
        ]
      },
      {
        kind: 'note',
        tone: 'warn',
        md: '`autoplay` 在多数浏览器里只在同时写了 `muted` 时才会真的自动播；带声音的自动播放会被拦掉。真要自动播，写 `autoplay muted` 并说明原因。'
      },
      {
        kind: 'prose',
        md: [
          '## 尺寸、封面与预加载',
          '',
          '`video` 的 `width` 和 `height` 写的是视频区的像素尺寸，跟 `img` 一个写法。不写就按默认的 300×150 显示，视频一加载完页面会跳一下。',
          '',
          '`poster` 是还没开始播放时那张封面图。`preload` 决定页面打开时预先下载多少内容：`none` 一个字节都不下，`metadata` 只取时长和尺寸，`auto` 交给浏览器自己决定。'
        ].join('\n')
      },
      {
        kind: 'demo',
        caption: '视频的尺寸、封面与字幕轨道',
        height: 260,
        html: [
          '<video controls width="360" height="200" poster="poster.jpg" preload="metadata">',
          '  <source src="lesson.mp4" type="video/mp4">',
          '  <track kind="subtitles" src="lesson.zh.vtt" srclang="zh" label="中文" default>',
          '  你的浏览器不支持 video 元素。',
          '</video>'
        ].join('\n'),
        checks: [
          'eq(attr("video", "poster"), "poster.jpg", "封面图")',
          'eq(attr("video", "preload"), "metadata", "preload 取 metadata")',
          'eq(attr("track", "srclang"), "zh", "字幕语言")',
          'eq(attr("track", "label"), "中文", "字幕的名字")',
          'has("track[default]", "默认打开这条字幕")'
        ]
      },
      {
        kind: 'prose',
        md: [
          '## `loop` 与 `muted`',
          '',
          '这两个都是布尔属性：写上去就生效。`<audio loop>` 与 `<audio loop="">` 等价，`loop="false"` 同样是开启——删掉属性才是关闭，改值不算。',
          '',
          '布尔属性只有名字本身有意义，所以别指望用 `loop="false"` 关掉循环。'
        ].join('\n')
      },
      {
        kind: 'note',
        tone: 'tip',
        md: '判断布尔属性开没开，用 CSS 选择器写在断言里更直接：`has("audio[loop]")`、`has("audio[muted]")`。'
      },
      {
        kind: 'demo',
        caption: '循环、静音、不预加载的背景音乐',
        height: 130,
        html: [
          '<audio controls loop muted preload="none">',
          '  你的浏览器不支持 audio 元素。',
          '</audio>'
        ].join('\n'),
        checks: [
          'has("audio[loop]", "循环播放")',
          'has("audio[muted]", "默认静音")',
          'eq(attr("audio", "preload"), "none", "不预加载")',
          'has("audio[controls]", "仍然给用户一条播放条")'
        ]
      },
      {
        kind: 'exercise',
        id: 'ex07-1',
        title: '让音频出现播放条',
        task: [
          '这是一个音频元素，页面上却什么都看不到，因为缺了让它长出控件的那个属性。',
          '',
          '要求：',
          '- 加上 `controls`，让浏览器画出播放条',
          '- 保留标签里面那行兜底文字'
        ].join('\n'),
        starter: {
          html: [
            '<audio>',
            '  你的浏览器不支持音频',
            '</audio>'
          ].join('\n')
        },
        solution: {
          html: [
            '<audio controls>',
            '  你的浏览器不支持音频',
            '</audio>'
          ].join('\n')
        },
        tests: [
          'eq(tag("audio"), "audio", "元素是 audio")',
          'has("audio[controls]", "audio 要带 controls 才会出现播放条")',
          'eq(text("audio"), "你的浏览器不支持音频", "标签里的兜底文字")'
        ],
        hints: [
          '布尔属性只写属性名：`<audio controls>`，不用写 `controls="true"`。',
          '那行文字留在标签里面，它是给认不出 `audio` 的浏览器准备的。'
        ],
        height: 160
      },
      {
        kind: 'exercise',
        id: 'ex07-2',
        title: '给视频定尺寸、加封面',
        task: [
          '这段视频现在按浏览器默认尺寸显示（300×150），加载完页面会跳一下。',
          '',
          '要求：',
          '- 把视频区固定成宽 480、高 270',
          '- 加一张封面图，属性值写 `cover.jpg`',
          '- 保留 `controls` 和兜底文字'
        ].join('\n'),
        starter: {
          html: [
            '<video controls>',
            '  你的浏览器不支持视频',
            '</video>'
          ].join('\n')
        },
        solution: {
          html: [
            '<video controls width="480" height="270" poster="cover.jpg">',
            '  你的浏览器不支持视频',
            '</video>'
          ].join('\n')
        },
        tests: [
          'eq(attr("video", "width"), "480", "video 的 width")',
          'eq(attr("video", "height"), "270", "video 的 height")',
          'eq(attr("video", "poster"), "cover.jpg", "封面图 poster")',
          'has("video[controls]", "保留播放控件")'
        ],
        hints: [
          '`width` 和 `height` 是标签上的属性，不是 CSS。',
          '封面图用 `poster`，值就是图片的路径。'
        ],
        height: 340
      },
      {
        kind: 'exercise',
        id: 'ex07-3',
        title: '用两个 source 给两套格式',
        task: [
          '`src` 只能给一个地址，拿到不认识的格式浏览器就放弃了。',
          '',
          '要求：',
          '- 把 `src` 从 `video` 上拿掉，改成两个 `<source>` 子元素',
          '- 第一个是 `course.mp4`，`type` 为 `video/mp4`',
          '- 第二个是 `course.webm`，`type` 为 `video/webm`',
          '- 兜底文字留在最后，`controls` 保留'
        ].join('\n'),
        starter: {
          html: [
            '<video controls src="course.mp4">',
            '  你的浏览器不支持视频',
            '</video>'
          ].join('\n')
        },
        solution: {
          html: [
            '<video controls>',
            '  <source src="course.mp4" type="video/mp4">',
            '  <source src="course.webm" type="video/webm">',
            '  你的浏览器不支持视频',
            '</video>'
          ].join('\n')
        },
        tests: [
          'eq(attr("video", "src"), null, "video 上不该再留 src")',
          'count("video > source", 2, "两个 source")',
          'eq(attr("video source", "type"), "video/mp4", "第一个 source 是 mp4")',
          'eq(attr("video source:nth-of-type(2)", "type"), "video/webm", "第二个 source 是 webm")',
          'eq(text("video"), "你的浏览器不支持视频", "兜底文字排在 source 后面")'
        ],
        hints: [
          '`<source>` 写在 `video` 里面，每个只给一个 `src` 和一个 `type`。',
          '顺序有意义：浏览器从第一个开始试，挑第一个 `type` 认得出来的。'
        ],
        height: 220
      },
      {
        kind: 'exercise',
        id: 'ex07-4',
        title: '给视频挂一条中文字幕',
        task: [
          '视频里说的是中文，听不见的读者只能看画面。',
          '',
          '要求：在 `video` 里加一条 `track`，满足：',
          '- `src` 是 `lesson.zh.vtt`',
          '- `kind` 是 `subtitles`',
          '- `srclang` 是 `zh`，`label` 是 `中文`',
          '- 用 `default` 让它默认打开'
        ].join('\n'),
        starter: {
          html: [
            '<video controls width="360" height="200">',
            '  <source src="lesson.mp4" type="video/mp4">',
            '  你的浏览器不支持视频',
            '</video>'
          ].join('\n')
        },
        solution: {
          html: [
            '<video controls width="360" height="200">',
            '  <source src="lesson.mp4" type="video/mp4">',
            '  <track kind="subtitles" src="lesson.zh.vtt" srclang="zh" label="中文" default>',
            '  你的浏览器不支持视频',
            '</video>'
          ].join('\n')
        },
        tests: [
          'count("video > track", 1, "一条字幕轨道")',
          'eq(attr("track", "kind"), "subtitles", "track 的 kind")',
          'eq(attr("track", "src"), "lesson.zh.vtt", "字幕文件")',
          'eq(attr("track", "label"), "中文", "track 的 label")',
          'has("track[default]", "默认打开这条字幕")'
        ],
        hints: [
          '`<track>` 是 `video` 的子元素，跟 `<source>` 一样是空元素，没有结束标签。',
          '`kind` 决定这条轨道是什么：字幕用 `subtitles`，章节用 `chapters`，画面说明用 `descriptions`。'
        ],
        height: 280
      },
      {
        kind: 'exercise',
        id: 'ex07-5',
        title: '页脚里的背景音乐',
        task: [
          '页脚要放一段背景音乐。页面打开时不要预先下载整段音频，播完之后接着播，一进来也不出声。',
          '',
          '要求：',
          '- `preload` 设为 `metadata`',
          '- 加 `loop`',
          '- 默认静音（`muted`）',
          '- 保留 `controls` 和兜底文字'
        ].join('\n'),
        starter: {
          html: [
            '<audio controls src="bgm.mp3">',
            '  你的浏览器不支持音频',
            '</audio>'
          ].join('\n')
        },
        solution: {
          html: [
            '<audio controls src="bgm.mp3" preload="metadata" loop muted>',
            '  你的浏览器不支持音频',
            '</audio>'
          ].join('\n')
        },
        tests: [
          'eq(attr("audio", "preload"), "metadata", "preload")',
          'has("audio[loop]", "循环播放")',
          'has("audio[muted]", "默认静音")',
          'has("audio[controls]", "保留播放控件")'
        ],
        hints: [
          '`preload` 三个值：`none`、`metadata`、`auto`。只想先知道时长，用 `metadata`。',
          '`loop` 和 `muted` 都是布尔属性，只写名字。'
        ],
        height: 160
      }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
