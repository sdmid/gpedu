var errorTips1='不可以领取，手机号关联账户已被冻结<br>请联系客服：400-080-2599',
	errorTips2='手机号码不正确',
	errorTips3='发送失败',
	errorTips4='验证码不正确',
	errorTips5='不可以领取，同一商家每日限制3次领取福豆';
	
//手机号和验证码定时器
var phoneTimer = null,
	vcodeTimer = null,
	pcodeTimer = null;
var sendVCodeInterval = 60;

var orderId = getUrlParam('orderId');
var money = getUrlParam('money');
var shopId = getUrlParam('shopId');
shopId = shopId.split('?')[0];

var isReset = false;
document.body.addEventListener('focusin', function(){
    isReset = false;
	//window.scroll(0,$(document).height());
});
document.body.addEventListener('focusout', function(){
    isReset = true;
    setTimeout(function(){
        if (isReset) {
            window.scroll(0, 0);
        }
    }, 300);
});

/* 通过参数查询可领取福豆 */
if(orderId && money && shopId){
	initPdt({
		appkey:payConfig.appkey,
        orderId:orderId,
		money:money,
		shopId:shopId
	}).then(function(data){
		var lt = data.data;
		$('#hlNumber').html(lt);
		$('#hlMoney').html(Number((lt/100).toFixed(2)));
		$('#getHLotbox').show();
		$('#banner1').show();
	}).catch(function(msg){
		$('#banner2').show();
	});
}else{
	$('#banner2').show();
}

/* 设置弹框后不可滚动 */
$(".popup-form").on("focus", "input", function(){
	$("body").css("overflow","hidden");
}).on("blur","input",function(){
	$("body").css("overflow","auto");
});
$('.popup-backdrop').bind("touchmove",function(e){
	e.preventDefault();
});

//打开弹框并初始化
$('#showPopup').click(function(){
	$('#phone').val('');
	$('#pcode').val('');
	$('#vcode').val('');
	setInputInit();
	setInputReadOnly($('#phone'));
	$('.popup-backdrop').addClass('active');
	$('.popup-form').addClass('popup-in');
	setTimeout(function(){
		$('#phone').focus();
	},300);
});
//点击关闭按钮关闭弹框
$('.close-box').click(function(){
	$('.popup-backdrop').removeClass('active');
	$('.popup-form').removeClass('popup-in');
	$('.popup-message').removeClass('popup-in');
});
//图片点击更换
$('.pcode-img').click(getCaptcha);
//图片验证码输入监听
$('#pcode').bind('input propertychange', function() {
	if(pcodeTimer !== null) clearTimeout(pcodeTimer);
	pcodeTimer = setTimeout(function(){
		var pcode = $('#pcode');
		if(pcode.val().length == 4){
			$('.error-tips').hide(function(){$('.error-tips').html('')});
		}
	});
});

//手机号码输入监听
$('#phone').bind('input propertychange', function() {
	if(phoneTimer !== null) clearTimeout(phoneTimer);
	phoneTimer = setTimeout(function(){
		var phone = $('#phone');
		if(phone.val().length == 11){
            $('.error-tips').hide(function(){$('.error-tips').html('')});
            $('.loader-01').hide();
            $('.vcode-btn').hide();
            $('.vcode-input').hide();
			if (isPhoneNo($.trim(phone.val())) == false) {//验证手机号是否合法
				$('.error-tips').show(function(){$('.error-tips').html(errorTips2)});
				$('.loader-01').hide();
			    return;
			}
			//比对缓存
			validateStorage(orderId,phone.val()).then(function(){
				//通过
				$('.loader-01').show();
				handlePhone({
                    appkey:payConfig.appkey,
                    orderId:orderId,
                    money:money,
                    shopId:shopId,
					phone:phone.val()
				}).then(function(data){
					var flag = data.data.flag ? data.data.flag : undefined;
					if(flag && flag == '200'){//显示可以领取
						setInputPass();
					}else if(flag && (flag == '1001' || flag == '1003')){//已经领取或订单异常
						$('.error-tips').show(function(){$('.error-tips').html(data.data.msg)});
						saveStorage({phone:phone.val(),orderId:orderId,msg:data.data.msg});
						$('.loader-01').hide();
					}else if(flag == '1002' || flag == '1009'){//超过领取限制
						$('.error-tips').show(function(){$('.error-tips').html(data.data.msg)});
						$('.loader-01').hide();
					}else if(flag && flag == '1004'){//手机号被冻结
						$('.error-tips').show(function(){$('.error-tips').html(errorTips1)});
						$('.loader-01').hide();
					}else if(flag && flag == '1005'){//手机号码还不是福分会员，需要短信验证码注册领取福豆
						getCaptcha();
					}else{
						$('.error-tips').show(function(){$('.error-tips').html('未知错误，请联系管理员')});
						$('.loader-01').hide();
					}
				}).catch(function(msg){
					$('.error-tips').show(function(){$('.error-tips').html('未知错误，请联系管理员')});
					$('.loader-01').hide();
				});
			}).catch(function(msg){
				//对比缓存存在异常
				$('.error-tips').show(function(){$('.error-tips').html(msg)});
				$('.loader-01').hide();
			});
		}else{
			setInputInit();
		}
	}, 300);
});
//验证码输入监听
$('#vcode').bind('input propertychange', function() {
	if(vcodeTimer !== null) clearTimeout(vcodeTimer);
	vcodeTimer = setTimeout(function(){
		var phone = $('#phone'),
			vcode = $('#vcode');
		if(phone.val().length == 11 && vcode.val().length == 6){
			$('#getHappyLot').prop('disabled',false);
		}else{
			$('.error-tips').hide(function(){$('.error-tips').html('')});
			$('.vcodeError').hide(function(){$('.vcodeError').html('')});
			$('#getHappyLot').prop('disabled','disabled');
		}
	}, 300);
});
//点击领取福豆
$('#getHappyLot').click(function(){
	var _this = this;
	$(_this).prop('disabled','disabled').html('<div class="loader-02" style="display: inline-block;float: none;margin: 0.4rem;"></div>正在领取');
	var params = {
        appkey:payConfig.appkey,
        orderId:orderId,
        money:money,
        shopId:shopId,
        phone:$('#phone').val()
	};
	var checkCode = $('#vcode').val();
	if(checkCode){
		params.checkCode = checkCode;
	}
	addBeans(params).then(function(data){
		var flag = data.data.flag ? data.data.flag : undefined;
		if(flag && flag == '200'){//领取成功
			$('.popup-form').removeClass('popup-in');
			$('.popup-message').addClass('popup-in');
			saveStorage({
				phone:params.phone,
				orderId:params.orderId,
				msg:'该订单已经领取福豆'
			});
		}else if(flag && flag == '2006'){//验证码不正确
			$('.vcodeError').show(function(){$('.vcodeError').html(errorTips4)});
		}else if(flag == '2007' || flag == '2008'){//2007会员被冻结//2008验证码过期
            $('.error-tips').show(function(){$('.error-tips').html(data.data.msg)});
        }else if(flag == '2011'){//2011订单支付尚未成功，领取失败，请稍后重试
            $('.error-tips').show(function(){$('.error-tips').html(data.data.msg)});
            $(_this).prop('disabled',false).html('领取福豆');
            return;
        }else{
			$('.error-tips').show(function(){$('.error-tips').html(data.data.msg)});
			saveStorage({
				phone:params.phone,
				orderId:params.orderId,
				msg:data.data.msg
			});
		}
		$(_this).prop('disabled','disabled').html('领取福豆');
	}).catch(function(data){
		$('.error-tips').show(function(){$('.error-tips').html('未知错误，请联系管理员')});
		$(_this).prop('disabled','disabled').html('领取福豆');
	});
});
//点击发送验证码
$('.vcode-btn').click(function(){
	var pcode = $('#pcode').val();
	if(!pcode){
		$('.error-tips').show(function(){$('.error-tips').html('请填写系统验证码')});
		return;
	}
	$('.vcodeError').hide();
	$(this).prop('disabled','disabled').html('<div class="loader-02" style="display: inline-block;float: none;margin: 0.2rem;"></div>发送中');
	sendMsgcode({appkey:payConfig.appkey,phone:$('#phone').val(),sysCode:pcode}).then(function(data){
		var flag = data.data.flag ? data.data.flag : undefined;
		if(flag && flag == '200'){
			$('.error-tips').show(function(){$('.error-tips').html('<span style="color:#363533">验证码发送成功<span>')});
			setTimeout(function(){
				$('.error-tips').hide(function(){$('.error-tips').html('')});
			},1500);
			setInputReadOnly($('#phone'),'readonly');
			countDown();
		}else{
			getCaptcha(true);
			var msg = data.data.msg ? data.data.msg : errorTips3;
			$('.error-tips').show(function(){$('.error-tips').html(msg)});
			sendVCodeInterval = 0;
			countDown();
		}
	}).catch(function(data){
		$('.vcodeError').show(function(){$('.vcodeError').html(errorTips3)});
		sendVCodeInterval = 0;
		countDown();
	});
});

$('#goEcshop').click(function(){
	location.href = payConfig.ecshopPath;
});

//发送验证码倒计时
function countDown() {
	var btnObj = $(".vcode-btn");
    sendVCodeInterval = sendVCodeInterval - 1;
    btnObj.html(sendVCodeInterval+"秒后重发");
	btnObj.attr("disabled",true);
    if (sendVCodeInterval <= 0){
        btnObj.html("重新发送");
		btnObj.attr("disabled",false);
        sendVCodeInterval = 60;
        return;
    }
    setTimeout('countDown()',1000);
}

//输入框重新初始化
function setInputInit(){
	$('#getHappyLot').prop('disabled',true);
	$('.loader-01').hide();
	$('.vcode-btn').hide();
	$('.vcode-input').hide();
	$('.pcode-input').hide();
	$('.error-tips').hide(function(){$('.error-tips').html('')});
	$('.tips').hide();
	sendVCodeInterval = 60;
	$(".vcode-btn").html("发送验证码");
	$('.vcodeError').show(function(){$('.vcodeError').html('')});
	$('#getHappyLot').prop('disabled','disabled').html('领取福豆');
}
//设置手机输入框是否只读
function setInputReadOnly(input,type){
	if(type == 'readonly'){
		input.attr('readonly','readonly');
		input.blur();
	}else{
		input.attr("readonly",false);
	}
}

//直接验证通过，可以领取福豆
function setInputPass(){
	$('.loader-01').hide();
	$('#getHappyLot').prop('disabled',false);
	setInputReadOnly($('#phone'));
}

//验证通过，需要发送验证码
function setVcodeShow(){
	$('.loader-01').hide();
	$('.vcode-btn').show();
	$('.vcode-input').show();
	$('.pcode-input').show();
	$('.tips').show();
}

/* 保存数据到缓存 */
function saveStorage(params){
	var existData = localStorage.existData ? JSON.parse(localStorage.existData) : [];
	existData.push(params);
	localStorage.existData = JSON.stringify(existData);
}
/* 验证数据是否存在缓存中 */
function validateStorage(orderId,phone){
	return new Promise(function(resolve, reject){
		var existData = localStorage.existData ? JSON.parse(localStorage.existData) : [];
		existData.forEach(function(item){
			if(item.orderId == orderId && item.phone == phone){
				reject(item.msg);
			}
		});
		resolve();
	});
}


/* 初始查询是否有可领福豆 */
function initPdt(params) {
	return new Promise(function(resolve, reject){
		try{
			$.ajax({
				url: payConfig.apiPath + "/wangyanFufen/productionFuBean",
				type: "post",
				data: params,
				success: function(data) {
					if(data.successful && data.data != '0'){
						resolve(data);
					}else{
						reject();
					}
				}
			}).fail(function() {
				console.log('请求失败');
				reject();
			});
		}catch(exception){
			console.log(exception);
			reject();
		}
	});
}

/* 输入手机号查询 */
function handlePhone(params) {
	return new Promise(function(resolve, reject){
		try{
			$.ajax({
				url: payConfig.apiPath + "/wangyanFufen/isNewPhoneOrCangetBeans",
				type: "post",
				data: params,
				success: function(data) {
					resolve(data);
				}
			}).fail(function() {
				console.log('请求失败');
				reject();
			});
		}catch(exception){
			console.log(exception);
			reject();
		}
	});
}

/* 领取福豆 */
function addBeans(params) {
	return new Promise(function(resolve, reject){
		try{
			$.ajax({
				url: payConfig.apiPath + "/wangyanFufen/addBeans",
				type: "post",
				data: params,
				success: function(data) {
					resolve(data);
				}
			}).fail(function() {
				console.log('请求失败');
				reject();
			});
		}catch(exception){
			console.log(exception);
			reject();
		}
	});
}

/* 发送短信验证码 */
function sendMsgcode(params) {
	return new Promise(function(resolve, reject){
		try{
			$.ajax({
				url: payConfig.apiPath + "/wangyanFufen/sendMsgcode",
				type: "post",
				data: params,
				success: function(data) {
					resolve(data);
				}
			}).fail(function() {
				console.log('请求失败');
				reject();
			});
		}catch(exception){
			console.log(exception);
			reject();
		}
	});
}

/* 获取图片验证码 */
function getCaptcha(refresh){
	var xhr = new XMLHttpRequest();
	xhr.open("POST", payConfig.apiPath + "/wangyanFufen/captcha?phone=" + $('#phone').val(), true);
	xhr.responseType = "blob";
	xhr.onload = function() {
		if (this.status == 200) {
			var blob = this.response;
			$('.pcode-img').attr("src",window.URL.createObjectURL(blob));
			if(!refresh)setVcodeShow();
		}
	 };
	xhr.send();
}