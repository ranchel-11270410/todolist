$(function () {

    //获取元素

    //$list: 列表到包裹器
    var $list = $("#wrap > .todolist .list");
    //$form： 输入表单
    var $form = $("#wrap > .todolist .form");
    var $formInput = $("#wrap > .todolist .form input[type=text]");
    //$delBtns：所有的删除按钮
    var $delBtns = null;
    //$settingBtns: 所有的设置按钮
    var $settingBtns =null;
    var $items = null;
    var $mask = $("#wrap > .todolist .mask");
    var $detail = $("#wrap > .todolist .detail");
    var $title = $("#wrap > .todolist .detail .main .content .title");
    var $titleInput =$("#wrap > .todolist .detail input[type=text].titleInput");
    var $textarea = $("#wrap > .todolist .detail .main .content textarea");
    var $date = $("#wrap > .todolist .detail .main .content input[type=text]#datetimepicker");
    var $updateBtn = $("#wrap > .todolist .detail .footer");
    var updateIndex = -1;
    var $completeBtns = null;
    //datetimepicker组件
    var $datetimepicker = $("#datetimepicker");
    $datetimepicker.datetimepicker();

    //初始化渲染
    var taskArr = store.get("todolist") || []; //获取todolist，如果获取不到就返回空数组
    render_todolist();

    //新增
    $form.submit(function (ev) {
        //阻止默认事件
        ev.preventDefault();
            //submit事件：当提交表单时，会发生submit事件。该事件只适用于表单元素，表单提交时触发。
            //获取input输入数据,使用 trim 去除字符串左右两端的空格
        var title = $(this).find("input[type=text]").val().trim();
            //如果为空，就直接return
            if (title === "")
                return;
            //修改数据  重新渲染
            var newTask = {
                title:title
            }
            //将新项添加到数组起始位置
            taskArr.unshift(newTask);
            render_todolist();

            //清空输入框
            $(this).find("input[type=text]").val("");
        })

    //双击title出现输入框
    $title.click(function () {
        $(this).hide();
        $titleInput.show();
    })

    //删除
    function listen_delBtn() {
        $delBtns.click(function () {
            var index = $(this).data("index");

           if(confirm("是否真的删除")){
               del_task(index);
           }
        })
        
    }
    function del_task(index) {
        //修改数据 重新渲染

        //删除一个，返回删除元素的数组
        taskArr.splice(index,1);
        render_todolist();
    }

    //详情需要的方法
    function listen_settingsBtn_items() {
        $settingBtns.click(function () {
            var index = $(this).data("index");
            updateIndex = index;
            show_mask_detail(index);
        })
        $items.dblclick(function () {
            var index = $(this).find(".settings").data("index");
            updateIndex = index;
            show_mask_detail(index);
        })
    }
    function  show_mask_detail(index) {
        $mask.show();
        $detail.show();

        $title.html(taskArr[index].title || "title");
        $titleInput.val(taskArr[index].title || "title");
        $textarea.val(taskArr[index].desc || "");
        $date.val(taskArr[index].date || moment().format("YYYY-MM-DD HH:mm"));
    }
    function hide_mask_detail() {
        $mask.hide();
        $detail.hide();
    }

    //更新
    $updateBtn.click(update);
    //更新需要的方法
    function update() {
        //更新数据 重新渲染
        taskArr[updateIndex].title = $titleInput.val();
        taskArr[updateIndex].desc = $textarea.val();
        taskArr[updateIndex].date = $date.val();

        //重置响铃任务   让定时器重新工作
        taskArr[updateIndex].remind = false;

        render_todolist();

        //关闭弹出层
        hide_mask_detail();
        //隐藏输入框，显示title-div
        $title.show();
        $titleInput.hide();
    }

    //响铃
    remind();
    function remind() {
        setInterval(function () {
            //拿到现在时间
            var nowTime = new Date().getTime();
            taskArr.forEach(function (task,index) {
                //如任务存在 且未设置 且 任务未提醒，进入判断
                if (task && task.date && !task.remind) {
                    //拿到当前任务时间
                    var taskTime = new Date(task.date).getTime();
                    if (nowTime - taskTime > 1) {
                        //为true提醒
                        task.remind = true;
                        render_todolist();
                    }
                }
            })
        },300)

    }

    //表单回显功能
    // 从 sessionStorage 获取数据
    $formInput.val(sessionStorage.getItem("$formInput"));
    $formInput[0].addEventListener("input",function () {
        /* 每当元素的 value 改变，input 事件都会被触发。这与 change 事件不同。
        change 事件仅当 value 被提交时触发，如按回车键，从一个 options 列表中选择一个值等。*/
        sessionStorage.setItem("$formInput",this.value);  // 保存数据到 sessionStorage
    })

    //标记为已完成需要的方法
    function listen_completeBtns() {
        $completeBtns.click(function (ev) {
            ev.preventDefault();
            var index = $(this).parent().find(".del").data("index");
            var task = taskArr[index];
            if (task.isCompleted) {
                task.isCompleted = false;
            } else {
                task.isCompleted = true;
            }
            render_todolist();
        })
    }

    //初始化渲染 & 根据数据进行重绘
    function render_todolist() {
        //存储
        store.set('todolist',taskArr);
        //每次数据重绘时html清空
        $list.html("");
        var completeArr = [];
        
/*        taskArr.forEach(function (item,index) {
            //将creat_task_item的返回值赋值给变量$item
            var $item = creat_task_item(item,index);
            $list.append($item);
        })*/
        
        taskArr.forEach(function (task,index) {
            if(task.isCompleted) {
                completeArr[index] = task;
            } else {
                var $item = creat_task_item(task,index);
                $list.append($item);
            }
        })
        completeArr.forEach(function (task,index) {
            if (!task)
                return;
            var $item = creat_task_item(task,index);
            $list.append($item);

        })

        //获取动态添加节点，绑定对应事件
        $delBtns = $("#wrap > .todolist .list .item .del");
        listen_delBtn();

        //详情
        $settingBtns =  $("#wrap > .todolist .list .item .settings");
        $items = $("#wrap > .todolist .list .item");
        listen_settingsBtn_items();

        //标记已完成
        $completeBtns = $("#wrap > .todolist .list .item input[type=checkbox]");
        listen_completeBtns();

    }

    //创建一个任务（item）
        function creat_task_item(task,index) {
            var $tpl = ' <div class="item '+(task.isCompleted?"isCompleted":"")+'">' +
                '<div class="icon-megaphone megaphone '+(task.remind&&!task.isCompleted?"":"hide")+'"></div>'+
                '      <input type="checkbox" '+(task.isCompleted?"checked":"")+' />' +
                '      <span>'+(task.title)+'</span>' +
                '      <span>' +
                '          <i class="icon-trash del" data-index='+index+'></i>' +
                '          <i class="icon-settings settings"  data-index='+index+'></i>' +
                '      </span>' +
                '  </div>';
        return $($tpl);
    }
})