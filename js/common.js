var __source=getLocal("SOURCE");//1小票扫码 2公众号 3停车场
var __city_code="85";//停车场city_code
function setLocal(n,v){
    window.localStorage.setItem(n,v);
}
function getLocal(v){
    return window.localStorage.getItem(v);
}
/**
 * 统一采用json格式进行数据传输
 * 请求统一参数为 timestamp，data，sign四个参数 请求消息示例：
 * {
     *     data: "h2shmc2JQe0+fEphMOBPuFTlJ2BsCj45P5quzraLIVINVxR530pfPP5TjppKBUb8zAHHicsmYUwTeRG3gjONpst1aCuZkxq/uBP0/PW29XI7RDzLlajOX5e7ay2nY3fkx2weGtFYnNwhfEsr+xBybJyCBI6fTui2aIHTw1iwY0A3MCCTAvHWkgtJa4q47AnLEy6euxVN4ihALUrAgqsVwA==",
     *     sign: "Y2Y4NjQ2MDRlZjUzZWNhNDM2NmFiNTAxOGYxYWY2NGY=",
     *     timestamp: 1553503659120
     * }
 * data: 采用des加密  Base64(des(原始数据)) des 加密 key=timestamp
 * sign: Base64 (MD5(timestamp+加密后的data))
 * **/
function encryptByDES(data){ //加密传输数据
    var timestamp=(new Date()).getTime();
    var content=CryptoJS.DES.encrypt(JSON.stringify(data), CryptoJS.enc.Utf8.parse(timestamp), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
    var jsonData={timestamp:timestamp,data:content};
    var sign=jsonData.timestamp+jsonData.data;
    jsonData.sign=CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse( CryptoJS.MD5(sign).toString() ));
    return jsonData;
}
function base64_decode(v){ //base64解码
    var words  = CryptoJS.enc.Base64.parse(v);
    return words.toString(CryptoJS.enc.Utf8);
}
function GetUrlParam(paraName) {//获取地址栏?后的参数
    var url = location.search;
    var theRequest={};
    if (url.indexOf("?")>-1) {
        var str = url.substr(1);
        var strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            // theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
            theRequest[strs[i].split("=")[0]]=decodeURI(strs[i].split("=")[1]);
        }
    }
    if(paraName) return theRequest[paraName];
    return theRequest;
}
function getRootPath() {
    return window.location.protocol + '//' + window.location.host + '/' ;
}
function isNull(_val){
    if(_val==""||_val==null||_val=="null"||_val==undefined){
        return true;
    }
    return false;
}
// var __url=getRootPath();
var my_url = getRootPath()
console.log(my_url)
var __url = 'http://www.lcgxlm.com:13259'
// var __url = 'http://192.168.1.104:13259'
function __post(url,data,callback,async){ //POST请求
    console.log("请求参数",data);
    mui.ajax(__url+url,{
        data:data,//加密传输
        dataType: "json", //服务器返回json格式数据
        type:"post",//HTTP请求类型
        async:async,
        // timeout:20000,//超时时间设置为20秒；
        headers:{"Content-Type":"application/json"},
        success:function(r){
            console.log("返回参数",r);
            // alert(r.errcode);
            if(!r) {
                return mui.toast("网络开小差了", "警告");
                // mui.openWindow({url:__url+"app/view/404.html"});
            }
            if(r.errcode === -801){//登陆失效
                return mui.alert(r.msg,"警告",function(){
                    var src=__source=="1"?"register":"login";//三码合一register 公众号停车场是login
                    mui.openWindow({url:__url+"app/view/"+src+".html"});
                });
            }
            // if(r.errcode !== 1 && r.errcode !== -1002 && r.errcode !== -811)
            //     return mui.toast(r.msg, "警告");
            if(callback) callback(r);
        },
        error:function(xhr,type,errorThrown){
            //异常处理；
            console.log(type);
            mui.alert("网络开小差了！", "警告")
        }
    })
}
var _appType=getAppType();
// var _appType=1;//默认支付宝 测试
function getAppId(){
    var _appId="";
    __post("auth/getAppId",{},function(r){
        _appId=_appType===1?r.data.ALI_APP_ID:r.data.WX_APP_ID;
        // _appId='2016063001567072';//测试
    },false);
    return _appId;
}
function getBuyerId(url){
    var app_id = "wx08551f6139c4b9fb";
    var buyerId=window.localStorage.getItem('BUYER_ID'),
        redirect_url = encodeURIComponent(getRootPath() + "/auth/getUserRelInfo?url=" + (url?url:location.href) +"&user_id="+(isNull(getLocal("USER_ID"))?"":getLocal("USER_ID")));
    if(buyerId) return buyerId;
    if(_appType===1){
        location.href = "https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id="+app_id+"&scope=auth_base&redirect_uri="+redirect_url;
    }else if(_appType===2){
        location.href="https://open.weixin.qq.com/connect/oauth2/authorize?appid="+app_id+"&redirect_uri="+redirect_url+"&response_type=code&scope=snsapi_base&state=1#wechat_redirect";
    }
}
function setBuyerId(){
    if(GetUrlParam("tId"))
        setLocal('BUYER_ID', GetUrlParam("tId"));
    else
        return "";
}
function getAppType(){
    var userAgent=navigator.userAgent,type=0; // 支付宝为1 微信为2
    if(userAgent.toLowerCase().indexOf("alipayclient") > 0){//支付宝
        type=1;
    }else if(userAgent.toLowerCase().indexOf("micromessenger") > 0){  //微信
        type=2;
    }else{
        type=3;
        // alert("请使用微信或支付宝支付");
        // mui.openWindow({url:__url+"/notice.html"});
    }
    return type;
}
// 由于js的载入是异步的，所以可以通过该方法，当AlipayJSBridgeReady事件发生后，再执行callback方法
function ready(callback) {
    if (window.AlipayJSBridge) {
        callback && callback();
    } else {
        document.addEventListener('AlipayJSBridgeReady', callback, false);
    }
}
String.prototype.format = function(args) {
    if(arguments.length>0) {
        var result = this;
        if(arguments.length == 1 && typeof (args) == "object"){
            for(var key in args){
                var reg=new RegExp ("({"+key+"})","g");
                result = result.replace(reg, args[key]);
            }
        }else{
            for (var i = 0; i < arguments.length; i++) {
                if(arguments[i]==undefined){
                    return "";
                }else{
                    var reg=new RegExp ("({["+i+"]})","g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    }else{
        return this;
    }
};
function show_msg(content){
    var popup = new Popup();
    popup.init();
    popup.create_dom(1,"警告",content,"确定","",function (){},function (){});
}
//验证车牌号
function regPlateNo(plateNo,palteColor){
    var reg=/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9空警使领学挂港澳]{1}$/;
    if(palteColor == '4') {
        reg=/^^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[DF]{1}[A-Z0-9]{4}[A-Z0-9空警使领学挂港澳]{1}$|^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9空警使领学挂港澳]{1}[DF]{1}$/;
    }
    var result = plateNo.match(reg);
    if(result==null){
        return true;
    }else{
        return false;
    }
}