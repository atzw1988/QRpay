(function(m) {
    mui.init();
    var current_page=1;//当前页 默认为第一页
    var userInfo={userId:getLocal("USER_ID"),loginKey:getLocal("LOGIN_KEY")};
    var obj={userId:getLocal("USER_ID"),loginKey:getLocal("LOGIN_KEY")};
    var param = GetUrlParam();//获取地址栏参数
    var _tpl=$("#payItem").html().replace(/\<!--|--\>/g,''),
        fooTpl=$("#footer").html().replace(/\<!--|--\>/g,''),
        _tplTicket=$("#ticketItem").html().replace(/\<!--|--\>/g,''),//可用优惠券
        _tplDisabled=$("#disableItem").html().replace(/\<!--|--\>/g,'');//不可用优惠券
    var acturePay,_acture_ticket;//实付金额 默认优惠券

    //初始化单页view
    var viewApi = mui("#app").view({defaultPage: "#payList"});
    mui('#ticket .mui-scroll-wrapper').scroll();
    mui.init({
        swipeBack: true, //启用右滑关闭功能
        pullRefresh : {
            container:"#pullrefresh",
            down:{
                style:'circle',
                auto: true,//可选,默认false.首次加载自动下拉刷新一次
                callback :function(){
                    getRecords(true);
                }
            },
            up: {
                contentrefresh : "正在加载...",
                contentnomore:'没有更多数据了',
                callback :function(){
                    getRecords(false);
                }
            }
        }
    });
    var _city_code="",_fee=0;
    function getRecords(isClear){
        if(isClear)//重新加载第一页
            current_page=1;
        var data={
            USER_ID:userInfo.userId,
            LOGIN_KEY:userInfo.loginKey,
            CITY_CODE:param.city_code,
            PAGE_INDEX:current_page
        };
        if(__source === "1"){ //扫码
            data.CAR_ID=getLocal("CAR_ID");
            data.PARK_RECORD_ID=getLocal("PARK_RECORD_ID");//扫码必填 公众号不要传
        }else{
            data.CAR_ID=param.car_id;
        }
        __post("app/getOwefeeRecordList",data,function(r){
            if(r.errcode !==1) return mui.toast(r.msg, "警告");
            if((!r.data || !r.data.RECORD_LIST.length) && isClear){
                $("#nodata").show();
                $("#recordList").hide();
                $("#footer").hide();
                mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
                return;
            }
            $("#nodata").hide();
            var res=r.data;
            _city_code=res.CITY_CODE;
            _fee=res.UNPAID_AMOUNT;
            res.UNPAID_AMOUNT=(res.UNPAID_AMOUNT*1/100).toFixed(2);
            if(!$.isEmptyObject(res.CAR_TICKET)){//如果有优惠券
                var acture=res.UNPAID_AMOUNT*1-(res.CAR_TICKET["TICKET_MONEY"]*1/100);
                res.ACTUAL_UNPAID_FEE=(acture>0?acture:0).toFixed(2);
                res.TICKET_MONEY="- ¥ "+res.CAR_TICKET["TICKET_MONEY"]*1/100;
                res.TICKET_MONEY_NUM=res.CAR_TICKET["TICKET_MONEY"]*1/100;
                res.TICKET_ID=res.CAR_TICKET["TICKET_ID"];
                _acture_ticket=res.CAR_TICKET["TICKET_ID"];
            }else{
                res.ACTUAL_UNPAID_FEE=res.UNPAID_AMOUNT;
                res.TICKET_MONEY="暂无可用优惠券";
                res.TICKET_MONEY_NUM=0;
                res.TICKET_ID="";
                _acture_ticket="";
            }
            acturePay=res.ACTUAL_UNPAID_FEE;
            $("#footer").html(fooTpl.format(res));
            if(!$.isEmptyObject(res.CAR_TICKET))
                $("._ticketAmount").removeClass("noticket");

            var str="";
            for(var i=0;i<res.RECORD_LIST.length;i++){
                var item=res.RECORD_LIST[i];
                item.UNPAID_FEE=(item.UNPAID_FEE*1/100).toFixed(2);
                str+=_tpl.format(item);
            }
            if(isClear) $("#recordList").html("");
            $("#recordList").append(str);
            $("#recordList").show();
            $("#footer").show();
            current_page++;
            if(isClear)
                mui("#pullrefresh").pullRefresh().endPulldownToRefresh();
            else
                mui('#pullrefresh').pullRefresh().endPullupToRefresh();
        },true);
    }
    mui("body").on("change","input[name=TICKET]",function(){ //选择优惠券
        viewApi.back();
        // console.log("选择",$(this).val());
    });
    mui(".ticket-group").on("tap","._showDetail",function(){ //查看优惠券使用说明
        var type=$(this).data("type");
        var target=$("#ticketDetail").find("._ticket"+type);
        target.show().siblings("._ticket").hide();
    });
    mui("#footer").on("tap","._submit",function(){
        $('._submit').attr("disabled",true);
        mui('._submit').button('loading');
        var _pay=acturePay*1,tickedId=$("._ticketAmount").data("id");
        if(_pay<0 || _pay===0){
            var data={
                USER_ID:getLocal("USER_ID"),
                LOGIN_KEY:getLocal("LOGIN_KEY"),
                CITY_CODE:_city_code,
                PAYMENT:10,//23.支付宝网页支付 3.微信公众号支付 10 全额抵扣
                TICKET_ID:tickedId,
                FEE:_fee
            };
            if(__source === "1") { //扫码
                data.CAR_ID=getLocal("CAR_ID");
                data.PARK_RECORD_ID=getLocal("PARK_RECORD_ID");
            }else{//公众号 停车场
                data.CAR_ID=param.car_id;
            }
            __post("app/pay/batchOrderPay",data,function(r){
                if(r.errcode !== 1) return mui.toast(r.msg, "警告");
                if(r.data.TRADE_STATUS==="SUCCESS"){
                    mui.alert("支付成功","提示",function(){
                        mui.openWindow({url:__url+"app/view/payList.html?car_id="+param.car_id});
                    });
                }else{
                    mui.alert("支付失败","警告",function(){
                        // __post("app/extra/payCancel",{TICKET_ID:tickedId});
                        window.location.reload();
                    });
                }
            },false);

            return;
        }
        if(_appType===1)
            aliPay();
        else if(_appType===2)
            wxPay();
    });
    function aliPay(){
        ready(function () {
            var payment = 23;
            //调用 获取交易号
            var tickedId=$("._ticketAmount").data("id");
            var tradeNo = getTradeData(payment,tickedId);
            if(isNull(tradeNo)){
                // mui.toast('请求超时');
                mui('._submit').button('reset');
                return;
            }
            // 通过传入交易号唤起快捷调用方式(注意tradeNO大小写严格)
            AlipayJSBridge.call("tradePay", {
                tradeNO: tradeNo
            }, function (data) {
                mui('._submit').button('reset');
                //console.log(JSON.stringify(data));
                if ("9000" == data.resultCode) {
                    var url=__url+"app/view/payList.html";
                    if(__source!=="1")
                        url=__url+"app/view/payList.html?car_id="+param.car_id;
                    // var url=__url+"app/view/newTicket.html?type=2";
                    // if(__source!=="1")
                    //     url=__url+"app/view/newTicket.html?type=2&car_id="+param.car_id;
                    mui.alert("支付成功","提示",function(){
                        mui.openWindow({url:url});
                    });
                }else{
                    // mui.toast('支付失败');
                    __post("app/extra/payCancel",{TICKET_ID:tickedId});
                    window.location.reload();
                }
            });
        });
    }
    function wxPay() {
        var payment = 3;
        //获取微信交易信息
        var tickedId=$("._ticketAmount").data("id");
        var postData = getTradeData(payment,tickedId);
        if(isNull(postData)){
            // mui.toast('请求超时');
            mui('._submit').button('reset');
            return;
        }
        WeixinJSBridge.invoke('getBrandWCPayRequest',JSON.parse(postData),  function(res) {
            mui('._submit').button('reset');
            WeixinJSBridge.log(res.err_msg);
            if (res.err_msg == "get_brand_wcpay_request:ok") {
                var url=__url+"app/view/payList.html";
                if(__source!=="1")
                    url=__url+"app/view/payList.html?car_id="+param.car_id;
                // var url=__url+"app/view/newTicket.html?type=2";
                // if(__source!=="1")
                //     url=__url+"app/view/newTicket.html?type=2&car_id="+param.car_id;
                mui.alert("支付成功","提示",function(){
                    mui.openWindow({url:url});
                });
            } else {
                // mui.toast('支付失败');
                __post("app/extra/payCancel",{TICKET_ID:tickedId});
                window.location.reload();
            }
        });
    }
// 获取交易信息
    function getTradeData(payment,tickedId){
        var tradeData="";
        var data={
            USER_ID:getLocal("USER_ID"),
            LOGIN_KEY:getLocal("LOGIN_KEY"),
            // CAR_ID:getLocal("CAR_ID"),
            CITY_CODE:_city_code,
            PAYMENT:payment,//23.支付宝网页支付 3.微信公众号支付
            TICKET_ID:tickedId,
            FEE:_fee
        };
        if(__source === "1") { //扫码
            data.CAR_ID=getLocal("CAR_ID");
            data.PARK_RECORD_ID=getLocal("PARK_RECORD_ID");
        }else{//公众号
            data.CAR_ID=param.car_id;
        }
        __post("app/pay/createBatchOrder",data,function(r){
            if(r.errcode === 1){
                tradeData=r.data.TRADE_DATA;
            }else if(r.errcode === -811 || r.errcode === -812){ //费用缴了一部分 还有部分没缴费(订单记录已更新)//已全部缴清(订单无需支付)
                mui("#popover").popover('show', document.getElementById("pop_position"));
            }else if(r.errcode === -818){ //第三方下单失败
                mui.toast(r.msg, "警告");
                __post("app/extra/payCancel",{TICKET_ID:tickedId});
            }else{
                return mui.toast(r.msg, "警告");
            }
        },false);
        return tradeData;
    }
    mui("#popover").on("tap","#reLoad",function(){
        window.location.reload();
    });
    //处理view的后退与webview后退
    var oldBack = m.back;
    m.back = function() {
        if (viewApi.canBack()) { //如果view可以后退，则执行view的后退
            viewApi.back();
        } else { //执行webview后退
            oldBack();
        }
    };
    // mui("#ticket").on("change","input[name=TICKET]",function(){
    //     // console.log($("input[name=TICKET]:checked").val());
    //     viewApi.back();
    // });
    var view = viewApi.view;
    view.addEventListener('pageBeforeShow', function(e) {
        var id=e.detail.page.id;
        if(id==='ticket'){
            getTicketList();
        }else{
            var checked=$("input[name=TICKET]:checked"),text="",ticketId="",ticketNum,total;
            if(!checked.length || checked.val()==""){
                text="不使用优惠券";
                if(!_acture_ticket) text="暂无可用优惠券";
                ticketId="";
                ticketNum=0;
                total=(_fee/100).toFixed(2);
                $("._ticketAmount").addClass("noticket");

            }else{
                $("._ticketAmount").removeClass("noticket");
                ticketId=checked.data("id");
                text="- ¥ "+checked.val();
                ticketNum=checked.val()*1;
                total=((_fee/100-checked.val()*1)>0?(_fee/100-checked.val()*1):0).toFixed(2);
            }
            acturePay=total;
            $("._ticketAmount").text(text);
            $("._ticketAmount").data("id",ticketId);
            $("._total").text('¥ '+total);
            $("._money_num").text("(已优惠 "+ticketNum+" 元)");
        }
    });
    function getTicketList(){
        var selectedId=$("._ticketAmount").data("id");
        if(selectedId==="") $("._noTicket input").prop("checked",true);
        var data={
            USER_ID:obj.userId,
            LOGIN_KEY:obj.loginKey,
            // CAR_ID:getLocal("CAR_ID"),
            IS_BATCHPAY:1,
            CITY_CODE:_city_code
        };

        if(__source === "1"){
            data.PARK_RECORD_ID=getLocal("PARK_RECORD_ID");
            data.CAR_ID=getLocal("CAR_ID");
        }else
            data.CAR_ID=param.car_id;
        __post("app/getOrderCarTicketList",data,function(r){
            if(r.errcode !==1) return mui.toast(r.msg, "警告");
            if(!r.data || !r.data.TICKET_LIST || r.data.TICKET_LIST.length<1){
                // noData();
                console.log("无优惠券");
                return;
            }
            var str="",disable="",list=r.data.TICKET_LIST;
            for(var i = 0;i < list.length;i ++){
                list[i].PLATE_NO=r.data.PLATE_NO;
                list[i].TICKET_MONEY=list[i].TICKET_MONEY*1/100;
                list[i].AREA_NAME=list[i].AREA_NAME?list[i].AREA_NAME:"不限";
                list[i].TICKET_NAME=getTicketName(list[i].TICKET_TYPE);
                if(list[i].IS_USABLE){
                    str += _tplTicket.format(list[i]);
                }else{
                    disable+=_tplDisabled.format(list[i]);
                }
            }
            str+=disable;
            // $("#nodata").hide();
            $("#ticketList").html(str);
            $("#ticketList input[data-id='"+selectedId+"']").prop("checked",true);
        },true);
    }
    function getTicketName(type){
        var obj={1:"现金券",2:"补缴券",3:"当日付"};
        return obj[type];
    }
    // view.addEventListener('pageShow', function(e) {
    //     var id=e.detail.page.id;
    //     console.log( id+ ' show');
    // });
})(mui);
