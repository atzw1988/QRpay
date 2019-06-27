(function (m) {
  function parse_url(url) { //定义函数
    var pattern = /(\w+)=(\w+)/ig; //定义正则表达式
    var parames = {}; //定义数组
    url.replace(pattern, function (a, b, c) {
      parames[b] = c;
    });
    return parames; //返回这个数组.
  }
  //获取当前url 取到code
  var url = window.location.href;
  console.log(url)
  var params = parse_url(url);
  //params.code 就是当前的code
  var code = params.code
  console.log(code)
  var sel_order = JSON.parse(getLocal('sel_order'))
  console.log(sel_order)
  // carId = carId.indexOf("?") < 0 ? carId : carId.substring(0, carId.indexOf("?"));
  mui.init({
    swipeBack: true, //启用右滑关闭功能
    pullRefresh: {
      container: "#pullrefresh",
      down: {
        style: "circle",
        auto: true,
        callback: function () {
          getCurrent();
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
  //获取选择的订单
  function getCurrent() {
    $("#recordList").html("").hide();
    var _tpl = $("#orderItem").html().replace(/\<!--|--\>/g, "")
    $("#recordList").prepend(_tpl.format(sel_order))
    mui("#pullrefresh").pullRefresh().endPulldownToRefresh()
    var html = $("#recordList").html();
    if ($.trim(html) === "") {
      $("#recordList").hide();
      $("#nodata").show();
    } else {
      $("#recordList").show();
    }
  }
  mui("body").on("tap", ".pay", function () {
    console.log(sel_order)
    if (isWeiXin()){
      let params = {
        code: code,
        order_no: sel_order.order_no,
        total_fee: sel_order.charge_money * 100
      }
      let url_wx_pay = '/its/admin/code/wxpay'
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
                mui.alert("支付成功！", '提示', () => {
                  window.location.pathname = '/itsPay/paylist.html'
                  // window.location.pathname = '/paylist.html'
                })
                // 使用以上方式判断前端返回,微信团队郑重提示：
                //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
              }else{
                mui.alert("支付失败！", '警告')
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
        order_no: sel_order.order_no,
        total_fee: sel_order.charge_money * 100
      }
      let url_ali = '/its/admin/codePay/alipay'
      __post(url_ali,params,(res) => {
        console.log(res)
        if (res.mesg == 'OK') {
          ap.tradePay({
            orderStr: res.orderString
          }, function (res) {
            if (res.resultCode == 9000) {
              mui.alert("支付成功！", '提示', () => {
                window.location.pathname = '/itsPay/paylist.html'
                // window.location.pathname = '/paylist.html'
              })
            } else {
              mui.alert("支付失败！", '警告')
            }
          })
        }
      },true)
    }
  })
  //处理webview后退
  var oldBack = m.back;
  m.back = function () {
    if (__source !== "1") //不是扫码则返回车牌列表页
      document.location.href = my_url + "/itsPay/login.html";
    else
      oldBack();
  };
})(mui);