(function (m) {
  setBuyerId();
  var obj = {
    userId: getLocal("USER_ID"),
    loginKey: getLocal("LOGIN_KEY")
  };
  // var ordersItem = $("#ordersItem").html().replace(/\<!--|--\>/g, "");
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
          getCurrent(); 
        }
      }
    }
  });

  function getCurrent() { //获取前订单
    $("#recordList").html("").hide();
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
      success: (res) => {
        if (res.data) {
          $("#loading").hide()
          let resp = {}
          resp = {
            carnumber:'粤B88888',
            starttime:'2019-06-12 12:00:00',
            sumMins:'1小时30分钟',
            money:20.00,
            zonename:'龙盛路',
            parkingspace:'401012'
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
        } else {
          mui.toast('该车辆还未出场', {
            duration: 'long'
          })
        }
      }
    })
  }
  mui("body").on("tap", ".stopcar", function () {
    mui.confirm('是否确认结束停车','温馨提示',(e) => {
      if(e.index == 1){
        console.log('结束停车')
      }else{
        console.log('取消操作')
        return
      }
    })    
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