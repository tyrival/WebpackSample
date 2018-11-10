import $ from 'jquery'

var Router = function(config) {
  // 兼容IE
  if(!window.HashChangeEvent){
    (function(){
      let lastURL = document.URL;
      window.addEventListener('hashchange',function(event){
        Object.defineProperty(event,'oldURL',{enumerable:true,configurable:true,value:lastURL});
        Object.defineProperty(event,'newURL',{enumerable:true,configurable:true,value:document.URL});
        lastURL = document.URL;
      });
    }());
  }
    var me = this;
    // 参数缓存
    me.dataStore = {};
    // 分隔符
    me.hashKey = config.hashKey || "#";
    // hash 与 html+js 映射关系
    me.mapper = config.mapper;
    // 路由dom
    me.view = config.view;
    // 错误显示dom
    me.errorTemplateId = config.errorTemplateId;
    // 事件
    me.listeners = $.extend({}, config.listeners);
    // id用于在全局管理器RouterManager中注册
    me.id = config.id || "router-" + new Date().getTime();

    // 调用listener的代理
    me.proxy = function(listenerName, context, param) {
        var func = context[listenerName];
        if (func && typeof func == "function") {
            return func.apply(context, param);
        }
    };

    // 路由启动
    me.start = function() {
        var me = this;
        var hashArr, routerLvl;
        // 无参数传入时，为新页面，直接从根路由开始加载；
        // 当有参数（HashChangeEvent）传入时，比较新旧Hash，得到要加载的路由节点；
        var arg = arguments[0];
        if (arg) {
            var newObj = me.parse(arg.newURL);
            var oldObj = me.parse(arg.oldURL);
            hashArr = newObj.hash;
            routerLvl = getHashDiffIndex(newObj.hash, oldObj.hash);
        } else {
            var obj = me.parse(location.hash);
            hashArr = obj.hash;
            routerLvl = 0;
        }

        // 根据完整的路由路线和加载路由的起始位置索引，获取路由参数
        var config = me.findRouterConfig(hashArr, routerLvl);
        var loadHashArr = hashArr.slice(routerLvl);
        // 递归加载路由
        doRouter();

        // 递归加载路由
        function doRouter() {
            if (!config) {
                return;
            }
            var callback = function() {
                loadHashArr.shift();
                config = config && config.mapper && config.mapper[hash] && config.mapper[hash]["child"];
                doRouter();
            };
            var hash = loadHashArr[0];
            me.loadView(config, hash, callback);
        }

        // 比较两个hash，得到从第几级路由开始变化，变化分3种情况：
        // 1. OldHash 和 NewHash 从第n级开始不同，NewHash存第n路由，返回n,
        //    此时从第n级路由开始加载，无需加载前面相同的部分；
        // 2. OldHash 和 NewHash 从第n级开始不同，NewHash不存在第n路由，返回n-1,
        //    此时需要重新加载n-1路由，用来重置n-1路由的首页。
        // 3. OldHash 和 NewHash 完全相同，返回 NewHash.length - 1，
        //    此时只重新加载最后一级路由
        function getHashDiffIndex(newArr, oldArr) {
            if (!newArr || newArr.length < 1) {
                return;
            }
            if (!oldArr || oldArr.length < 1) {
                return 0;
            }
            var loop = Math.max(oldArr.length, newArr.length);
            for (var i = 0; i < loop; i++) {
                var newHash = newArr[i];
                var oldHash = oldArr[i];
                if (newHash != oldHash) {
                    if (!newHash) {
                        return i - 1;
                    } else {
                        return i;
                    }
                }
            }
            return loop - 1;
        }
    };

    // 启动路由和注册Hash变更监听
    me.start();

    // 注册HashChange事件
    window.onhashchange = function(event) {
        me.start(event);
    };

    // 全局路由管理器
    var RouterManager = window.RouterManager;
    if (!RouterManager) {
        RouterManager = {
            routers: {},
            get: function(id) {
                return this.routers[id];
            },
            reg: function(router) {
                if (!router || !router.id) {
                    alert("路由注册失败，未定义路由ID");
                    return;
                }
                if (this.routers[router.id]) {
                    alert("路由注册失败，已存在ID为" + id + "的路由。");
                    return;
                }
                this.routers[router.id] = router;
            },
            unreg: function(id) {
                if (this.routers[id]) {
                    delete this.routers[id];
                }
            }
        };
        window.RouterManager = RouterManager;
    }
    // 注册路由实例
    RouterManager.reg(this);

    me.proxy(me.listeners, "onInit", [me]);
};

Router.prototype.constructor = Router;

// 根据路由配置和Hash值进行视图路由
Router.prototype.loadView = function(config, hash, callback) {
    var me = this;
    var view = config.view;
    var mapper = config.mapper;
    if (!view || !mapper) {
        console.error("Router错误：未找到路由入口或路由的配置，hash=" + hash);
    }
    var page = mapper[hash];
    // 如果未找到路由配置项，则跳转到该路由的默认页
    if (!page) {
        hash = mapper["default"];
        location.hash = location.hash + me.hashKey + hash;
        return;
    }
    var url = page.url;
    var controller = page.controller;
    // 加载html
    me.proxy(me.listeners, "beforeRouter", [me, hash]);

    $.ajax({
        type: "get",
        url: url,
        dataType: "html",
        success: function(data, status, xhr) {
            $(view).html(data);
            // 加载js
            me.loadScript(controller, callback);
        },
        error: function(xhr, errorType, error) {
            if ($(config.errorTemplateId).length === 0) {
                return false;
            }
            var errHtml = $(config.errorTemplateId).html();
            errHtml = errHtml.replace(/{{errStatus}}/, xhr.status);
            errHtml = errHtml.replace(/{{errContent}}/, xhr.responseText);
            $(view).html(errHtml);
        }
    });
};

// 加载js
Router.prototype.loadScript = function(src, callback) {
    var me = this;
    var script = document.createElement("script"),
        loaded;
    script.setAttribute("src", src);
    script.onreadystatechange = script.onload = function() {
        script.onreadystatechange = null;
        document.documentElement.removeChild(script);
        script = null;
        if (!loaded) {
            if (typeof callback === "function")
                callback();
        }
        loaded = true;
    };
    document.documentElement.appendChild(script);
    me.proxy(me.listeners, "afterRouter", [me]);
};

// 根据路由路径和起始位置索引，递归查询路由配置
Router.prototype.findRouterConfig = function(hashArr, level) {
    var me = this;
    var config = {
        view: me.view,
        mapper: me.mapper
    };
    if (!hashArr || hashArr.length < 1) {
        return config;
    }
    for (var i = 0; i < hashArr.length; i++) {
        var hash = hashArr[i];
        // 错误处理
        if (!config.mapper) {
            var hashStr = "";
            for (var j = 0; j <= i; j++) {
                hashStr += hashArr[j];
            }
            console.error("Router错误：未定义第" + i + "级路由" + hash + " 路径为 " + hashStr);
        }
        // 向下查找
        if (level == i) {
            break;
        } else {
            config = config.mapper[hash].child;
        }
    }
    return config;
};

// 路由跳转，只修改#后的hash部分
Router.prototype.go = function(routerUrl, paramObj) {
    location.hash = this.stringify(routerUrl, paramObj);
};

// 网址重定向
Router.prototype.link = function(url, paramObj) {
    location.href = this.stringify(url, paramObj);
	location.reload();
};

// 后退
Router.prototype.backward = function() {
    history.back();
};

// 前进
Router.prototype.forward = function() {
    history.forward();
};

// url+参数 转为 带参url
Router.prototype.stringify = function(url, paramObj) {
    var paramStr = "";
    for (var i in  paramObj) {
        paramStr += i + "=" + encodeURIComponent(paramObj[i]) + "&";
    }
    if (paramStr === "") {
        return url;
    }
    return url + "?" + paramStr.substring(0, paramStr.length - 1);
};

// 解析带参Hash
Router.prototype.parse = function(url) {
    var result = {
        hash: [],
        param: {}
    };
    if (!url) {
        return result;
    }
    var hashKeyIndex = url.indexOf(this.hashKey);
    if (hashKeyIndex < 0) {
        return result;
    }
    var hash = url.substring(hashKeyIndex + this.hashKey.length);
    // 分割hash与参数
    var sepIndex = hash.indexOf("?");
    if (sepIndex > -1) {
        result.hash = hash.substring(0, sepIndex).split(this.hashKey);
        var paramArr = hash.substring(sepIndex + 1).split("&");
        for (var i = 0; i < paramArr.length; i++) {
            var param = paramArr[i];
            if (!param) {
                continue;
            }
            var kv = paramArr[i].split("=");
            result.param[kv[0]] = decodeURIComponent(kv[1]);
        }
    } else {
        result.hash = hash.split(this.hashKey);
    }
    return result;
};

/* 内存传参的缓存 */
Router.prototype.getData = function(id) {
    return this.dataStore[id];
};

Router.prototype.setData = function(id, obj) {
    if (!id) {
        return;
    }
    this.dataStore[id] = obj;
};

Router.prototype.deleteData = function(id) {
    if (!id || !this.dataStore || !this.dataStore[id]) {
        return;
    }
    delete this.dataStore[id];
};

Router.prototype.clearData = function() {
    this.dataStore = {};
};

export default Router;