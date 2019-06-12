(function(m){
    mui.init();
    setBuyerId();
    if(!getLocal("BUYER_ID"))
        getBuyerId();
    var wait,phone_reg="^(13[0-9]|14[57]|15[012356789]|16[6]|17[0135678]|18[0-9]|19[89])[0-9]{8}$";
    var margin= document.body.clientHeight - $(".btn-wrap").offset().top - $("._notice").height()-55;
    $("._notice").css("margin-top",margin+'px').show();
    $(document).keydown(function(event){ //阻止键盘提交
        if(event.keyCode == 13) {
            event.preventDefault();
        }
    });
    mui("body").on("tap","._sendCode",function(){
        if($(this).hasClass("disabled")) return;
        var phone=$("input[name=MOBILE_NUMBER]").val();
        var result = phone.match(phone_reg);
        if(!result) {
            mui.alert("请输入正确手机号！");
            return false;
        }
        wait=50; time();
        var data={MOBILE_NUMBER: phone,REASON:"3"};
        __post("app/login/sendCaptcha",data,function(r){
            if(r.errcode !==1) return mui.alert(r.msg, "警告");
        },true);
    }).on("tap","._login",function(){
        $("._login").attr("disabled",true);
        mui("._login").button("loading");
        var phone=$("input[name=MOBILE_NUMBER]").val(),codes=$("input[name=CAPTCHA]").val();
        var result = phone.match(phone_reg);
        if(!result){
            mui.alert("请输入正确手机号！");
            mui('._login').button('reset');
            return;
        }
        if($.trim(codes).length !== 6){
            mui.alert("请输入正确的验证码！", "警告");
            mui('._login').button('reset');
            return;
        }
        var data={USER_ACCOUNT:phone,TYPE:"0",CAPTCHA:codes,PASSWORD:"",SOURCE:__source,CITY_CODE:""};
        if(_appType===1)
            data.ALI_USER_ID=getLocal("BUYER_ID");
        else
            data.OPEN_ID=getLocal("BUYER_ID");
        __post("app/login/doLogin",data,function(r){
            mui('._login').button('reset');
            if(r.errcode !==1)
                return mui.toast(r.msg, "警告");
            if(!r.data)
                return mui.toast(r.msg, "警告");
            localStorage.removeItem("USER_ID");
            localStorage.removeItem("LOGIN_KEY");
            setLocal("USER_ID",r.data["USER_ID"]);
            setLocal("LOGIN_KEY",r.data["LOGIN_KEY"]);
            mui.openWindow({url:__url+"app/view/myCar.html"});
        },true);
    });

    function time(){
        var times=$("._time"),send=$("._sendCode"),timeout=$("p.time");
        if (wait == 0) {
            times.text(0);
            timeout.addClass("disabled");
            send.removeClass("disabled");
        } else {
            times.text(wait);
            timeout.removeClass("disabled");
            send.addClass("disabled");
            wait--;
            setTimeout(function() {
                time();
            }, 1000);
        }
    }
})(mui);
