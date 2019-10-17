var payConfig = function () {
    return {
		path: '/happyLotMobile',
		apiPath: 'https://kpcloud.kaopupay.biz/api/happylot',
		appkey: 'a6314669a2e345f38d8d9b368519034e',
		ecshopPath: 'https://ecs.kp5000.com/ecshopmobile/cpInfo/index',//靠谱内供链接
        vConsole: 0,
        version: 2,
        openVconsole: function () {
            if(typeof(VConsole) !== 'function'){
                var self = this;
                asyncLoadJs(payConfig.path+'/js/vconsole.min.js',function () {
                    self.vConsole = new VConsole();
                    var myPlugin = new VConsole.VConsolePlugin('my_plugin', '自定义插件');
                    myPlugin.on('addTool', function(callback) {
                        var button = {
                            name: '刷新当前页面',
                            onClick: function(event) {
                                location.reload(true);
                            }
                        };
                        callback([button]);
                    });
                    myPlugin.on('renderTab', function(callback) {
                        callback("");
                    });
                    self.vConsole.addPlugin(myPlugin);
                });
            }
        },
        closeVconsole: function () {
            this.vConsole = 0;
        },
    }
}();

(function () {
    if(!payConfig.vConsole){
        //click vConsole
        var count = 0;
        document.addEventListener('touchend',function (e) {
            ++count;
            if(count > 20){
                payConfig.openVconsole();
            }
        });
    }else{
        payConfig.openVconsole();
    }
}());

function user_agent() {
    var u = navigator.userAgent;
    var env = {};
    env.isWeiXin = function () {
        return u.indexOf('MicroMessenger') > -1;
    };
    env.isAlipay = function () {
        return u.indexOf('AlipayClient') > -1;
    };
    env.isAndroid = function () {
        return u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
    };
    env.isIOS = function () {
        return !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    };
    env.isKaoPu = function () {
        return /kaopu/i.test(u) || typeof kp5000 === 'object';
    };
    env.getKaoPuVersion = function () {
        var match = u.match(/kaopu\/(\w.+)/);
        if (match && match[1]) {
            return match[1];
        }
        return 0;
    };
    return env;
}

//异步加载js资源
function asyncLoadJs(src, callback) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src;
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
    s.onload = function () {
        callback && callback();
    }
}

//异步加载css资源
function asyncLoadCss(src, callback) {
    var s = document.createElement('link');
    s.rel = "stylesheet";
    s.href = src;
    var x = document.getElementsByTagName('link')[0];
    x.parentNode.insertBefore(s, x);
    s.onload = function () {
        callback && callback();
    }
}

/**
 * 获取URL传参数方法
 */
function getUrlParam(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if (r != null) return unescape(r[2]); return null;
}

/**
* 验证是否手机号
**/
function isPhoneNo(phone) {
    var pattern = /^1[3456789]\d{9}$/;
    return pattern.test(phone);
}