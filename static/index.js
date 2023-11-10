
(function(w) {
    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);// 确定设备类型是否为桌面端
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;// 根据设备类型设置字体单位和元素位置
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');// 动态写入样式
    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};// 定义键盘映射
    if (isDesktop) {
        document.write('<div id="gameBody">');
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (Object.keys(map).indexOf(key) !== -1) {
                click(map[key])
            }
        }// 如果是桌面端，添加键盘事件监听
    }
    let body, blockSize, GameLayer = [],
        GameLayerBG, touchArea = [],
        GameTimeLayer;
    let transform, transitionDuration;

    // 全局对象 w 的方法 init，用于初始化游戏
    w.init = function() {
        // 显示欢迎界面
        showWelcomeLayer();
        
        // 获取游戏主体元素
        body = document.getElementById('gameBody') || document.body;
        
        // 设置 body 高度和一些 CSS3 变换属性
        body.style.height = window.innerHeight + 'px';
        transform = typeof (body.style.webkitTransform) != 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !=
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');
        
        // 获取游戏图层元素
        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayer.push(document.getElementById('GameLayer1'));
        GameLayer[0].children = GameLayer[0].querySelectorAll('div');
        GameLayer.push(document.getElementById('GameLayer2'));
        GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        GameLayerBG = document.getElementById('GameLayerBG');
        
        // 添加触摸事件或鼠标事件
        if (GameLayerBG.ontouchstart === null) {
            GameLayerBG.ontouchstart = gameTapEvent;
        } else {
            GameLayerBG.onmousedown = gameTapEvent;
        }
        
        // 初始化游戏设置和大小
        gameInit();
        initSetting();
        
        // 监听窗口大小变化事件
        window.addEventListener('resize', refreshSize, false);
        
        // 获取按钮元素并设置点击事件
        let btn = document.getElementById('ready-btn');
        btn.className = 'btn btn-primary btn-lg';
        btn.onclick = function () {
            closeWelcomeLayer();
        }
    }

    // 打开新窗口的方法
w.winOpen = function() {
    // 在当前页面打开一个新窗口，带有随机参数
    window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
    
    // 在当前窗口打开一个空白页面
    let opened = window.open('about:blank', '_self');
    
    // 防止新窗口引用当前窗口，避免安全问题
    opened.opener = null;
    
    // 关闭新打开的空白页面
    opened.close();
}


    // 定义定时器变量
    let refreshSizeTime;
    
// 刷新窗口大小
    w.refreshSize = function() {
        clearTimeout(refreshSizeTime);
        refreshSizeTime = setTimeout(_refreshSize, 200);
    }
// 真正的刷新窗口大小的方法
    w._refreshSize = function() {
        countBlockSize();// 计算方块大小
        // 重新设置游戏图层中每个方块的位置和大小
        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j],
                    rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px';
                rstyle.height = blockSize + 'px';
            }
        }
        // 根据游戏图层位置调整元素的显示位置
        let f, a;
        if (GameLayer[0].y > GameLayer[1].y) {
            f = GameLayer[0];
            a = GameLayer[1];
        } else {
            f = GameLayer[1];
            a = GameLayer[0];
        }
        let y = ((_gameBBListIndex) % 10) * blockSize;
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = -blockSize * Math.floor(f.children.length / 4) + y;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }
// 计算方块大小
    w.countBlockSize = function() {
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight;
        touchArea[1] = window.innerHeight - blockSize * 3;
    }

    // 游戏相关变量的初始化
let _gameBBList = [],          // 存储游戏中的方块信息
_gameBBListIndex = 0,       // 当前方块在列表中的索引
_gameOver = false,          // 游戏结束标志
_gameStart = false,         // 游戏开始标志
_gameTime,                  // 游戏计时器
_gameTimeNum,               // 游戏剩余时间
_gameScore,                 // 游戏得分
_date1,                     // 游戏开始时间
deviation_time;             // 游戏时间偏差

// 初始化游戏
w.gameInit = function() {
// 注册音效文件
createjs.Sound.registerSound({
    src: "./static/music/err.mp3",
    id: "err"
});
createjs.Sound.registerSound({
    src: "./static/music/end.mp3",
    id: "end"
});
createjs.Sound.registerSound({
    src: "./static/music/tap.mp3",
    id: "tap"
});

// 重置游戏状态
gameRestart();
}

// 重置游戏状态
w.gameRestart = function() {
_gameBBList = [];             // 清空方块列表
_gameBBListIndex = 0;         // 重置方块索引
_gameScore = 0;               // 重置得分
_gameOver = false;            // 重置游戏结束标志
_gameStart = false;           // 重置游戏开始标志
_gameTimeNum = 20;            // 重置剩余时间
GameTimeLayer.innerHTML = creatTimeText(_gameTimeNum); // 更新剩余时间显示
countBlockSize();             // 重新计算方块大小
refreshGameLayer(GameLayer[0]); // 刷新游戏图层
refreshGameLayer(GameLayer[1], 1); // 刷新游戏图层（第二个参数表示循环刷新）
}


    // 游戏开始
w.gameStart = function() {
    _date1 = new Date(); // 记录游戏开始的时间
    _gameStart = true;   // 设置游戏开始标志为 true
    _gameTime = setInterval(gameTime, 1000); // 启动游戏计时器，每秒调用 gameTime 方法
}

// 游戏结束
w.gameOver = function() {
    _gameOver = true; // 设置游戏结束标志为 true
    clearInterval(_gameTime); // 清除游戏计时器
    setTimeout(function () {
        GameLayerBG.className = ''; // 清空游戏背景层的类名
        showGameScoreLayer(); // 显示游戏分数层
    }, 1500);
}

// 使用 JSEncrypt 进行文本加密
w.encrypt = function(text) {
    let encrypt = new JSEncrypt();
    encrypt.setPublicKey("MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTzGwX6FVKc7rDiyF3H+jKpBlRCV4jOiJ4JR33qZPVXx8ahW6brdBF9H1vdHBAyO6AeYBumKIyunXP9xzvs1qJdRNhNoVwHCwGDu7TA+U4M7G9FArDG0Y6k4LbS0Ks9zeRBMiWkW53yQlPshhtOxXCuZZOMLqk1vEvTCODYYqX5QIDAQAB");
    return encrypt.encrypt(text);
}

// 游戏计时器每秒调用的方法
w.gameTime = function() {
    _gameTimeNum--; // 剩余时间减一
    if (_gameTimeNum <= 0) {
        // 如果剩余时间小于等于零，显示时间到，并触发游戏结束操作
        GameTimeLayer.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;時間到！';
        gameOver();
        GameLayerBG.className += ' flash'; // 添加闪烁效果的类名
        createjs.Sound.play("end"); // 播放结束音效
    } else {
        // 更新剩余时间显示
        GameTimeLayer.innerHTML = creatTimeText(_gameTimeNum);
    }
}

// 创建显示时间文本的方法
w.creatTimeText = function(n) {
    return '&nbsp;TIME:' + n;
}


    // 正则表达式，匹配类名中带有 t1、t2、t3... 的部分
let _ttreg = / t{1,2}(\d+)/,
// 正则表达式，匹配类名中带有 t1、t2、t3... 和 bad 的部分
_clearttClsReg = / t{1,2}\d+| bad/;

// 刷新游戏图层
w.refreshGameLayer = function(box, loop, offset) {
// 随机选择一个位置来显示方块
let i = Math.floor(Math.random() * 1000) % 4 + (loop ? 0 : 4);
for (let j = 0; j < box.children.length; j++) {
    let r = box.children[j],
        rstyle = r.style;
    
    // 设置方块的位置和大小
    rstyle.left = (j % 4) * blockSize + 'px';
    rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
    rstyle.width = blockSize + 'px';
    rstyle.height = blockSize + 'px';

    // 移除类名中匹配 _clearttClsReg 的部分，清除之前可能添加的 t1、t2、t3... 和 bad 类名
    r.className = r.className.replace(_clearttClsReg, '');

    if (i === j) {
        // 如果当前位置是随机选择的位置
        _gameBBList.push({
            cell: i % 4,
            id: r.id
        });
        // 随机生成 t1、t2、t3... 类名，表示该位置有方块
        r.className += ' t' + (Math.floor(Math.random() * 1000) % 5 + 1);
        r.notEmpty = true;
        // 计算下一个随机位置
        i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 1000) % 4;
    } else {
        // 如果当前位置不是随机选择的位置，表示该位置无方块
        r.notEmpty = false;
    }
}

if (loop) {
    // 如果是循环刷新
    box.style.webkitTransitionDuration = '0ms';
    box.style.display = 'none';
    // 计算 box 的垂直偏移量
    box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
    setTimeout(function () {
        box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        setTimeout(function () {
            box.style.display = 'block';
        }, 100);
    }, 200);
} else {
    // 如果不是循环刷新，直接置零
    box.y = 0;
    box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
}
// 设置过渡效果的时间
box.style[transitionDuration] = '150ms';
}


    // 将游戏图层向下移动一行
w.gameLayerMoveNextRow = function() {
    for (let i = 0; i < GameLayer.length; i++) {
        let g = GameLayer[i];
        g.y += blockSize;

        // 如果图层 g 的垂直位置超过了当前图层高度的边界
        if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
            // 刷新图层，使图层循环显示
            refreshGameLayer(g, 1, -1);
        } else {
            // 否则，设置图层的垂直偏移，实现向下移动的效果
            g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
        }
    }
}

// 处理游戏点击事件
w.gameTapEvent = function(e) {
    // 如果游戏已结束，不处理点击事件
    if (_gameOver) {
        return false;
    }

    let tar = e.target;
    let y = e.clientY || e.targetTouches[0].clientY,
        x = (e.clientX || e.targetTouches[0].clientX) - body.offsetLeft,
        p = _gameBBList[_gameBBListIndex];

    // 如果点击位置超出触摸区域的上下边界，不处理点击事件
    if (y > touchArea[0] || y < touchArea[1]) {
        return false;
    }

    // 判断点击位置是否正确
    if (
        (p.id === tar.id && tar.notEmpty) ||
        (p.cell === 0 && x < blockSize) ||
        (p.cell === 1 && x > blockSize && x < 2 * blockSize) ||
        (p.cell === 2 && x > 2 * blockSize && x < 3 * blockSize) ||
        (p.cell === 3 && x > 3 * blockSize)
    ) {
        // 如果游戏尚未开始，开始游戏
        if (!_gameStart) {
            gameStart();
        }

        // 播放点击音效
        createjs.Sound.play("tap");

        // 获取点击位置的方块元素，并修改其类名，添加点击效果
        tar = document.getElementById(p.id);
        tar.className = tar.className.replace(_ttreg, ' tt$1');

        // 更新游戏数据
        _gameBBListIndex++;
        _gameScore++;

        // 将游戏图层向下移动一行
        gameLayerMoveNextRow();
    } else if (_gameStart && !tar.notEmpty) {
        // 如果点击位置错误且游戏已经开始，播放错误音效，游戏结束
        createjs.Sound.play("err");
        gameOver();
        tar.className += ' bad';
    }

    // 阻止事件的默认行为
    return false;
}


    // 创建游戏图层的 HTML 结构
w.createGameLayer = function() {
    let html = '<div id="GameLayerBG">';
    
    // 循环创建两个游戏图层
    for (let i = 1; i <= 2; i++) {
        let id = 'GameLayer' + i;
        html += '<div id="' + id + '" class="GameLayer">';
        
        // 循环创建每个图层中的方块元素
        for (let j = 0; j < 10; j++) {
            for (let k = 0; k < 4; k++) {
                html += '<div id="' + id + '-' + (k + j * 4) + '" num="' + (k + j * 4) + '" class="block' + (k ? ' bl' : '') +
                    '"></div>';
            }
        }
        html += '</div>';
    }
    
    // 添加计时图层的 HTML 结构
    html += '</div>';
    html += '<div id="GameTimeLayer"></div>';
    return html;
}

// 关闭欢迎图层
w.closeWelcomeLayer = function() {
    let l = document.getElementById('welcome');
    l.style.display = 'none';
}

// 显示欢迎图层
w.showWelcomeLayer = function() {
    let l = document.getElementById('welcome');
    l.style.display = 'block';
}

// 显示游戏得分图层
w.showGameScoreLayer = function() {
    let l = document.getElementById('GameScoreLayer');
    
    // 获取最后一个方块的类名中的数字
    let c = document.getElementById(_gameBBList[_gameBBListIndex - 1].id).className.match(_ttreg)[1];
    
    // 替换图层的类名中的颜色数字
    l.className = l.className.replace(/bgc\d/, 'bgc' + c);
    
    // 设置得分图层的文字内容
    document.getElementById('GameScoreLayer-text').innerHTML = shareText(_gameScore);
    
    // 设置得分文字内容，如果游戏时间偏差小于 23000，则显示得分，否则显示红色得分
    let score_text = '得分&nbsp;&nbsp;';
    score_text += deviation_time < 23000 ? _gameScore : "<span style='color:red;'>" + _gameScore + "</span>";
    document.getElementById('GameScoreLayer-score').innerHTML = score_text;
    
    // 获取最佳得分并更新最佳得分的显示
    let bast = cookie('bast-score');
    if (deviation_time < 23000) {
        if (!bast || _gameScore > bast) {
            bast = _gameScore;
            cookie('bast-score', bast, 100);
        }
    }
    document.getElementById('GameScoreLayer-bast').innerHTML = '最佳&nbsp;&nbsp;' + bast;
    
    // 显示得分图层
    l.style.display = 'block';
}


    // 隐藏游戏得分图层
w.hideGameScoreLayer = function() {
    let l = document.getElementById('GameScoreLayer');
    l.style.display = 'none';
}

// 重新开始游戏按钮点击事件
w.replayBtn = function() {
    // 重新初始化游戏
    gameRestart();
    // 隐藏得分图层
    hideGameScoreLayer();
}

// 返回欢迎图层按钮点击事件
w.backBtn = function() {
    // 重新初始化游戏
    gameRestart();
    // 隐藏得分图层
    hideGameScoreLayer();
    // 显示欢迎图层
    showWelcomeLayer();
}

// 根据得分生成分享文本
w.shareText = function(score) {
    let date2 = new Date();
    // 计算游戏时间偏差
    deviation_time = (date2.getTime() - _date1.getTime())
    // 如果游戏时间偏差超过 23000 毫秒，返回相应的提示
    if (deviation_time > 23000) {
        return '倒計時多了' + ((deviation_time / 1000) - 20).toFixed(2) + "s";
    }
    // 根据得分返回不同的分享文本
    if (score <= 49) return '你只是個小小光';
    if (score <= 99) return '看來變成了小光';
    if (score <= 149) return '現在是個中光';
    if (score <= 199) return '完了 變大光了';
    return '這就是我的 邪王真眼';
}

// 将对象转换为字符串
w.toStr = function(obj) {
    if (typeof obj === 'object') {
        return JSON.stringify(obj);
    } else {
        return obj;
    }
}


    // 设置/获取 cookie
w.cookie = function(name, value, time) {
    if (name) {
        if (value) {
            if (time) {
                // 如果设置了时间，将时间转换为 GMT 字符串
                let date = new Date();
                date.setTime(date.getTime() + 864e5 * time);
                time = date.toGMTString();
            }
            // 设置 cookie
            return document.cookie = name + "=" + escape(toStr(value)) + (time ? "; expires=" + time + (arguments[3] ?
                "; domain=" + arguments[3] + (arguments[4] ? "; path=" + arguments[4] + (arguments[5] ? "; secure" : "") : "") :
                "") : ""), !0;
        }
        // 获取 cookie 值
        value = document.cookie.match("(?:^|;)\\s*" + name.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1") + "=([^;]*)");
        value = value && "string" == typeof value[1] ? unescape(value[1]) : !1;
        // 如果是 JSON 格式或者数字字符串，使用 eval 进行转换
        (/^(\{|\[).+\}|\]$/.test(value) || /^[0-9]+$/g.test(value)) && eval("value=" + value);
        return value;
    }
    // 获取所有 cookie 数据
    let data = {};
    value = document.cookie.replace(/\s/g, "").split(";");
    for (let i = 0; value.length > i; i++) {
        name = value[i].split("=");
        name[1] && (data[name[0]] = unescape(name[1]));
    }
    return data;
}

// 在文档中写入游戏图层的 HTML 结构
document.write(createGameLayer());

// 初始化设置，如果已经设置了键盘布局，则从 cookie 中读取并应用
w.initSetting = function() {
    if (cookie("keyboard")) {
        document.getElementById("keyboard").value = cookie("keyboard");
        // 将键盘布局映射关系存储在全局变量 map 中
        map = {}
        map[cookie("keyboard").charAt(0).toLowerCase()] = 1;
        map[cookie("keyboard").charAt(1).toLowerCase()] = 2;
        map[cookie("keyboard").charAt(2).toLowerCase()] = 3;
        map[cookie("keyboard").charAt(3).toLowerCase()] = 4;
    }
}

// 显示按钮组
w.show_btn = function() {
    document.getElementById("btn_group").style.display = "block";
    document.getElementById("setting").style.display = "none";
}

// 显示设置界面
w.show_setting = function() {
    document.getElementById("btn_group").style.display = "none";
    document.getElementById("setting").style.display = "block";
}

// 保存键盘布局到 cookie，并初始化设置
w.save_cookie = function() {
    cookie('keyboard', document.getElementById("keyboard").value, 100);
    initSetting();
}

// 判断值是否为空
w.isnull = function(val) {
    let str = val.replace(/(^\s*)|(\s*$)/g, '');
    return str === '' || str === undefined || str == null;
}

function click(index) {
    // 获取当前点击的方块信息
    let p = _gameBBList[_gameBBListIndex];
    // 计算点击的方块编号
    let base = parseInt(document.getElementById(p.id).getAttribute("num")) - p.cell;
    let num = base + index - 1;
    let id = p.id.substring(0, 11) + num;

    // 构造模拟的点击事件对象
    let fakeEvent = {
        clientX: ((index - 1) * blockSize + index * blockSize) / 2 + body.offsetLeft,
        // 确保在触摸区域内
        clientY: (touchArea[0] + touchArea[1]) / 2,
        target: document.getElementById(id),
    };

    gameTapEvent(fakeEvent);
    }
}) (window);