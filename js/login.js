(function(m){
    mui.init();
    window.localStorage.removeItem('mobile')
    let mobile = window.localStorage.getItem('mobile')
    console.log(mobile)
    let carId = window.localStorage.getItem('car_no')
    if(mobile != null){
        if (mobile.length == 11){
            window.location.pathname = '/itsPay/stopcar.html'
            // window.location.pathname = '/stopcar.html'
        } 
    }else{
        mui.alert("距离上次登录时间过长,请重新登录！", "警告")
    }
    // setBuyerId();
    // if(!getLocal("BUYER_ID"))
    //     getBuyerId();
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
        var data={mobile: phone};

        __post("/its/admin/charge/send?mobile=" + phone, data, function (res) {
            console.log(res)
            if (res.code !== 0) return mui.alert(res.data, "警告");
        },true);
    }).on("tap","._login",function(){
        $("._login").attr("disabled", true)
        mui("._login").button("loading")
        let mobile = $("input[name=MOBILE_NUMBER]").val()
        let codes = $("input[name=CAPTCHA]").val()
        let result = mobile.match(phone_reg)
        if(!result){
            mui.alert("请输入正确手机号！")
            mui('._login').button('reset')
            return
        }
        if($.trim(codes).length !== 6){
            mui.alert("请输入正确的验证码！", "警告")
            mui('._login').button('reset')
            return
        }
        __post("/its/admin/charge/verifyCode?mobile=" + mobile + '&code=' + codes, {}, (res) => {
            if (!res.fail){
                let data = {
                    carNo: carId,
                    mobile: mobile
                }
                let url = '/its/admin/charge/isRegister'
                __post(url, data, (res) => {
                    if (!res.fail) {
                        mui.toast('登陆成功', {
                            duration: 'long',
                            type: 'div'
                        })
                        mui('._login').button('reset')
                        window.localStorage.setItem('mobile', data.mobile)
                        window.location.pathname = '/itsPay/stopcar.html'
                        // window.location.pathname = '/stopcar.html'
                    } else {
                        mui.toast('登陆失败,请重新尝试!', {
                            duration: 'long',
                            type: 'div'
                        })
                        mui('._login').button('reset')
                    }
                }, true)
            }else{
                mui.alert(res.mesg, "警告");
                mui('._login').button('reset')
            }
        },true)
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
