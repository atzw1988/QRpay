(function (m) {
  setBuyerId();
  var _tpl = $("#orderItem").html().replace(/\<!--|--\>/g, "")
  var url = "/its/admin/charge/findOrderList"
  var page_index = 1
  // var carId = GetUrlParam("car_id") ? GetUrlParam("car_id") : ""; //公众号 停车场获取carId
  window.localStorage.removeItem('sel_order')
  var carId = window.localStorage.getItem('car_no')
  var resp
  // carId = carId.indexOf("?") < 0 ? carId : carId.substring(0, carId.indexOf("?"));
  mui.init({
    swipeBack: true, //启用右滑关闭功能
    pullRefresh: {
      container: "#pullrefresh",
      down: {
        style: "circle",
        auto: true,
        callback: function () {
          getCurrent(true); //扫码 停车场显示当前单笔订单
        }
      },
      up: {
        contentrefresh: "正在加载...",
        contentnomore: '没有更多数据了',
        callback: function () {
          getCurrent(false);
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
  function formatDatenew(inputTime) {
    var date = new Date(inputTime);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
  }
  function getCurrent(isClear) { //获取前订单
    if (isClear){
      page_index = 1
    }
    var data = {
      car_no: carId,
      pageSize:10,
      currentPage: page_index
    };
    $('.no_more').hide()
    __post(url,data,(res) => {
      console.log(res)
      if (res.data.pages <= page_index) {
        $('.no_more').show()
      }
      if (res.data.pages < page_index) {
        return mui('#pullrefresh').pullRefresh().endPullupToRefresh() 
      }
      if(res.code == 0 && res.data.list.length > 0){
        $("#loading").hide()
        $('#nodata').hide()
        resp = res.data.list
        let order_num = res.data.total
        let str = ''
        resp.forEach(item => {
          if (item.buy_time < 60) {
            item.buy_time = item.buy_time + '分钟'
          } else if (item.buy_time == 60) {
            item.buy_time = '1小时'
          }else{
            item.buy_time = Math.floor(item.buy_time / 60) + '小时' + item.buy_time % 60 + '分钟'
          }
          item.parkstart_time = formatDatenew(item.parkstart_time)
          item.parkend_time = formatDatenew(item.parkend_time)
          str += _tpl.format(item)
        })
        $('.car_no').html(carId + '(共' + order_num + '个欠费订单)')
        if (isClear) {
          $("#recordList").html("")
        }
        $("#recordList").prepend(str)
        page_index++
        if (isClear) {
          mui("#pullrefresh").pullRefresh().endPulldownToRefresh()
        } else {
          mui('#pullrefresh').pullRefresh().endPullupToRefresh()
        }
      }else{
        $('.car_no').html(carId + '(共0个欠费订单)')
        $("#loading").hide()
        $('#nodata').show()
        mui("#pullrefresh").pullRefresh().endPulldownToRefresh()
      }
    },true)
  }
  mui("body").on("tap", ".res-text", function () {
    console.log(1)
    document.location.href = my_url + '/' + $(this).attr("href")
  }).on("tap", ".pay", function (e) {
    let num = e.target.id
    let order = resp.filter(item => {
      return item.order_no == num
    })[0]
    window.localStorage.setItem('sel_order', JSON.stringify(order))
    if (isWeiXin()) {
      var appid = "wx08551f6139c4b9fb";
      var redirect_uri = encodeURIComponent("http://www.lcgxlm.com/fastPay/payfor.html");
      window.location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + appid +
        "&redirect_uri=" +
        redirect_uri + "&response_type=code&scope=snsapi_base#wechat_redirect"
    } else if (isAlipay()) {
      source = "alipayjs";
      window.location.pathname = '/itsPay/payfor.html'
      // window.location.pathname = '/payfor.html'
    } else {
      window.location.pathname = "/itsPay/notice.html"
      // window.location.pathname = '/payfor.html'
      return;
    }
  }).on("tap",".pays",(e) => {
    console.log(3)
    console.log(e)
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