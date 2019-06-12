(function (m) {
  var current_page = 1; //当前页 默认为第一页
  var userInfo = {
    userId: getLocal("USER_ID"),
    loginKey: getLocal("LOGIN_KEY")
  };
  var param = GetUrlParam(); //获取地址栏参数
  var _tpl = $("#payItem").html().replace(/\<!--|--\>/g, '');
  getRecords();
  mui.init({
    swipeBack: true,
    pullRefresh: {
      container: "#pullrefresh",
      down: {
        style: 'circle',
        callback: function () {
          getRecords(true);
        }
      },
      up: {
        contentrefresh: "正在加载...",
        contentnomore: '没有更多数据了',
        callback: function () {
          getRecords(false);
        }
      }
    }
  });

  function getRecords(isClear) {
    if (isClear) { //重新加载第一页
      current_page = 1;
    }
    var data = {
      carnumber: "粤B88888"
    };
    __post("/its/charge/unPay", data, (res) => {
      console.log(res)
      if (res.code !== 0) return mui.toast(res.msg, "警告");
      if (!res.data || !res.data.length) return mui('#pullrefresh').pullRefresh().endPullupToRefresh();
      let str = ''
      res.data.forEach(item => {
        if (item.sumMins < 60) {
          item.sumMins = item.sumMins + '分钟'
        } else if (item.sumMins == 60) {
          item.sumMins = '1小时'
        } else {
          item.sumMins = Math.floor(item.sumMins / 60) + '小时' + item.sumMins % 60 + '分钟'
        }
        str += _tpl.format(item)
      })
      if (isClear) $("#recordList").html("");
      $("#recordList").append(str);
      current_page++;
      if (isClear)
        mui("#pullrefresh").pullRefresh().endPulldownToRefresh();
      else
        mui('#pullrefresh').pullRefresh().endPullupToRefresh();
    }, true);
  }
})(mui);
