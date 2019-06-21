(function (m) {
  // setBuyerId();
  // var ordersItem = $("#ordersItem").html().replace(/\<!--|--\>/g, "");
  // var carId = GetUrlParam("car_id") ? GetUrlParam("car_id") : ""; //公众号 停车场获取carId
  var carId = window.localStorage.getItem('car_no')
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
    var _tpl = $("#orderItem").html().replace(/\<!--|--\>/g, "")
    $.ajax({
      type: 'get',
      url: 'http://www.lcgxlm.com:13259/its/admin/charge/isOut',
      // url: 'http://192.168.1.104:13259/its/admin/charge/isOut',
      data: {
        carid: encodeURI(carId)
      },
      success: (res) => {
        console.log(res)
        if (res.data.length > 0) {
          $("#loading").hide()
          let resp = res.data[0]
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
          window.location.pathname = '/itsPay/paylist.html'
          // window.location.pathname = '/paylist.html'
        }
      }
    })
  }
  mui("body").on("tap", ".stopcar", function () {
    mui.confirm('是否确认结束停车','温馨提示',(e) => {
      if(e.index == 1){
        let url = '/its/admin/charge/closeOrder'
        let data = {
          car_no: carId
        }
        __post(url,data,(res) => {
          console.log(res)
          if(res.data){
            window.location.pathname = '/itsPay/paylist.html'
            // window.location.pathname = '/paylist.html'
          }else{
            mui.alert("结束停车失败，请重新尝试！", '警告')
          }
        },true)
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
      document.location.href = my_url + "/itsPay/login.html";
    else
      oldBack();
  };
})(mui);