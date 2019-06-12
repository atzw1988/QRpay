(function (m) {
  setBuyerId();
  var obj = {
    userId: getLocal("USER_ID"),
    loginKey: getLocal("LOGIN_KEY")
  };
  var ordersItem = $("#ordersItem").html().replace(/\<!--|--\>/g, "");
  // var carId = GetUrlParam("car_id") ? GetUrlParam("car_id") : ""; //公众号 停车场获取carId
  var carId = window.localStorage.getItem('car_no')
  var carId = '粤B88888'
  var order
  // carId = carId.indexOf("?") < 0 ? carId : carId.substring(0, carId.indexOf("?"));
  mui.init({
    swipeBack: true, //启用右滑关闭功能
    pullRefresh: {
      container: "#pullrefresh",
      down: {
        style: "circle",
        auto: true,
        callback: function () {
          getRecords();
          getCurrent(); //扫码 停车场显示当前单笔订单
        }
      }
    }
  });
  //判断是否是微信
  function isWeiXin() {
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
      return true;
    } else {
      return false;
    }
  }
  //判断是否是支付宝
  function isAlipay() {
    var userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.match(/Alipay/i) == "alipay") {
      return true;
    } else {
      return false;
    }
  }
  function getCurrent() { //获取前订单
    var _tpl = $("#orderItem").html().replace(/\<!--|--\>/g, ""),
      url = "/its/charge/isPay";
    var data = {
      carnumber: carId,
    };
    $.ajax({
      type: 'get',
      url: 'http://www.lcgxlm.com:13259/its/charge/isOut',
      data: {
        carid: carId
      },
      success: (res)=> {
        if(res.data){
          __post(url,data,(res) => {
            if(!res.data){
              let url_one = '/its/charge/shouldPay'
              __post(url_one,data,(res) => {
                if(res.code == 0){
                  $("#loading").hide()
                  order = res.data
                  let resp = res.data
                  resp.shouldmoney = (resp.shouldmoney * 1).toFixed(2)
                  if (resp.sumMins < 60){
                    resp.sumMins = resp.sumMins + '分钟'
                  } else if (resp.sumMins == 60){
                    resp.sumMins = '1小时'
                  }else{
                    resp.sumMins = Math.floor(resp.sumMins / 60) + '小时' + resp.sumMins%60 + '分钟'
                  }
                  $("#recordList").prepend(_tpl.format(resp))
                  mui("#pullrefresh").pullRefresh().endPulldownToRefresh()
                  var html = $("#recordList").html();
                  if ($.trim(html) === "") {
                    $("#recordList").hide();
                    $("#nodata").show();
                  } else {
                    $("#recordList").show();
                  }
                }
              },true)
              
            }else{
              mui.toast('该车辆当前订单费用已经付清', {
                duration: 'long'
              })
            }
          },true)
        }else{
          mui.toast('该车辆还未出场',{
            duration: 'long'
          })
        }
      }
    })
  }

  function getRecords() {
    $("#loading").show();
    $("#nodata").hide();
    $("#recordList").html("").hide();
    let data = {
      carnumber: carId
    }
    let url_two = '/its/charge/unPay'
    __post(url_two, data, (res) => {
      if (res.code == 0) {
        $("#loading").hide()
        let money = 0
        res.data.forEach(ele => {
          money += ele.shouldmoney
        })
        let resp = {
          shouldmoney: money.toFixed(2),
          AREA_NAME: '嵊州',
          carnumber: data.carnumber,
          UNPAID_COUNT: res.data.length,
          HISTORY_DETAIL: "historyDetails.html"
        }
        $("#recordList").prepend(ordersItem.format(resp))
        mui("#pullrefresh").pullRefresh().endPulldownToRefresh()
        var html = $("#recordList").html();
        if ($.trim(html) === "") {
          $("#recordList").hide();
          $("#nodata").show();
        } else {
          $("#recordList").show();
        }
      }
    }, true)
  }
  mui("body").on("tap", ".res-text", function () {
    console.log(1)
    document.location.href = my_url + '/' + $(this).attr("href")
  }).on("tap", ".pay", function () {
    console.log(2)
    console.log(order)
    if (isWeiXin()){
      let params = {
        code: code,
        tradeNo: order.id,
        total_fee: order.shouldmoney * 100
      }
      let url_wx_pay = '/its/admin/pay/brake'
      __post(url_wx_pay,params,(res) => {
        if(res.success){
          function onBridgeReady() {
            WeixinJSBridge.invoke(
            'getBrandWCPayRequest', 
            {
              "appId": res.data.appId, //公众号id，由商户传入
              "timeStamp": res.data.timeStamp, //时间戳，自1970年以来的秒数
              "nonceStr": res.data.nonceStr, //随机串
              "package": res.data.package, //订单详情扩展字符串
              "signType": res.data.signType, //微信签名方式：
              "paySign": res.data.paySign //微信签名
            },
            function (res) {
              console.log(res)
              if (res.err_msg == "get_brand_wcpay_request:ok") {
                $('.content').hide()
                $('.amount').hide()
                $('.successto').show()
                $('.carno div').removeClass('active')
                $('.payno div').removeClass('active')
                $('.success div').addClass('active')
                // 使用以上方式判断前端返回,微信团队郑重提示：
                //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
              }
            })
          }
          if (typeof WeixinJSBridge == "undefined") {
            if (document.addEventListener) {
              document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
            } else if (document.attachEvent) {
              document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
              document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
            }
          } else {
            onBridgeReady();
          }
        }else{

        }
      },true)
    } else if (isAlipay()){
      let params = {
        tradeNo: order.id,
        total_fee: order.shouldmoney * 100
      }
      let url_ali = '/its/admin/brake/alipay'
      __post(url_ali,params,(res) => {
        console.log(res)
        if (res.mesg == 'OK') {
          ap.tradePay({
            orderStr: res.orderString
          }, function (res) {
            if (res.resultCode == 9000) {
              $('.content').hide()
              $('.amount').hide()
              $('.successto').show()
              $('.carno div').removeClass('active')
              $('.payno div').removeClass('active')
              $('.success div').addClass('active')
            } else {
              $(".errPlate").text("支付失败");
              $(".errPlateBtn").remove();
              $(".mask").show();
            }
          })
        }
      },true)
    }
  }).on("tap",".pays",(e) => {
    console.log(3)
    console.log(e)
  })
  //处理webview后退
  var oldBack = m.back;
  m.back = function () {
    if (__source !== "1") //不是扫码则返回车牌列表页
      document.location.href = my_url + "login.html";
    else
      oldBack();
  };
})(mui);