try {
    console.debug("extension start");
    grn;
} catch(e) {
    console.debug("initialize garoon");
    grn = {};
}
(function() {
    // TODO: カラー系などの設定は別で持つ
    console.log("content script is loaded, you can use $");
    // global
    var $LINKS = [];
    var SELECTED_INDEX = 0;
    // define functions //
    /**
     * カーソル移動の対象としたいリンク一覧を取得
     */
    var getUnreads = function() {
        console.debug("getUnreads");
        // 未読
        // /cbgrn/grn/image/cybozu/bulletin20.gif?20170330.text
        var $bulletin = $("a[href^='/cgi-bin/cbgrn/grn.cgi/bulletin/view']");
        var unreadLinks = $bulletin.find(".bold").parent();
        // 更新掲示板は画像で決まる
        var modifiedLinks = $bulletin.find("img[src*='bulletin20_u.gif']").parent();
        // TODO: 掲示板以外：スケジュールも対象にしたいかも スペースもかも

        // 対象となるリンク先を全マージ
        $links = $.merge(modifiedLinks, unreadLinks);

        // 暫定で色をつける
        $links.css("backgroundColor", "#FCC");
        return $links;
    };

    /**
     * j キーを押した時のショートカット動作
     * 次の未読リンクへ移動
     */
    var inputJ = function() {
        // TODO: 実装
        console.log("j pressed");
        moveCursor(1);
    };
    /**
     * k キーを押した時のショートカット動作
     * 前の未読リンクへ移動
     */
    var inputK = function() {
        // TODO: 実装
        console.log("k pressed");
        moveCursor(-1);
    };

    /**
     * カーソルの移動
     * $LINKS の範囲の中で移動する
     */
    var moveCursor = function(n) {
        console.log("move cursor");
        $($LINKS.get(SELECTED_INDEX)).css("background-color", "#FCC");
        // TODO: 循環参照するようにマイナスやプラスでオーバーした時の対応
        var size = $LINKS.length;

        if (size < SELECTED_INDEX + n && n > 0) {
            SELECTED_INDEX += n - size;
        } else if (SELECTED_INDEX < Math.abs(n) && n < 0) {
            SELECTED_INDEX += size + n;
        } else {
            SELECTED_INDEX += n;
        }
        if (SELECTED_INDEX === size) {
            SELECTED_INDEX = 0;
        }
        console.log(SELECTED_INDEX);
        console.log($LINKS, typeof $LINKS);
        $($LINKS.get(SELECTED_INDEX)).css("background-color", "#CCF");
        // 選択していることが分かるようにアクティブリンクの色を変える
    }

    /**
     * u キーを押した時の実装
     * 描画エリアを閉じる（中身をクリアする）
     */
    var inputU = function() {
        console.log("u pressed");
        resetViewArea();
    };

    /**
     * o キーを押した時の実装
     * リンク先をロードして表示する
     */
    var inputO = function() {
        console.log("o pressed");
        console.log($LINKS);
        var $a = $($LINKS.get(SELECTED_INDEX));
        console.log($a.attr("href"));
        $.ajax({
            url: $a.attr("href")
        })
        .done(function(data) {
            //  <dic class="unread_color"> の部分が未読
            var $html = $(data);
            // TODO: 下記のパターンは、ど新規ではなく更新差分があった場合の見方になる
            var $unreads = $html.find(".unread_color");
            $unreads.each(function() {
                $("#grn_extension_view_area").append($(this).html() + '<div class="border-partition-follow-grn"></div>');
            });
        });

    };

    /**
     * 初期ロードでAjaxで読み込んだ内容を描画するフィールドを作成する
     */
    var createViewArea = function() {
        console.log("createViewArea");
        var area = '<div id="grn_extension_view_area" style="border: 5px solid #FFF"/>';
        $(".mainarea").prepend(area);
    };

    /**
     * 描画されている内容を一旦消去する
     */
    var resetViewArea = function() {
        console.log("resetViewArea");
        $("#grn_extension_view_area").html("");
    };

    /**
     * m キーを押した時の実装
     * 会議室先を取得してスケジュールにロードする
     * ※ 画面読み込み時にロードしても良いかも
     */
    var inputM = function() {
        // TODO: リンクじゃないのにappendしている部分があるように見えるので要調査
        console.log("load meeting room");
        $meetings = $("a[href^='/cgi-bin/cbgrn/grn.cgi/schedule/view']");
        console.info($meetings);
        $meetings.each(function(){
            var $obj = $(this);
            // 読み込み不要なスケジュールは読まない
            // TODO: ここはリファクタリングすべき
            if ($obj.parent().hasClass("listTime")) {
                return true;
            }
            if ($obj.has("img[src^='/cbgrn/grn/image/cybozu/banner16.gif']").length !== 0) {
                // バナー予定は読まない
                return true;
            }
            $.ajax({
                url: $(this).attr("href")
            })
            .done(function(data) {
                //  <span class="facility-grn"><a ...>会議室名</a></span>
                $html = $(data);
                var room = $html.find(".facility-grn").text();
                if (room.length === 0) {
                    room = "未設定";
                }
                room = "[場所：" + room + "]";
                $obj.append(room);
            });
        });
    };


    var unreads = [];

    // start main logic //
    var main = function() {
        $LINKS = getUnreads();
        $(document).on("keydown", null, "j", inputJ);
        $(document).on("keydown", null, "k", inputK);
        $(document).on("keydown", null, "o", inputO);
        $(document).on("keydown", null, "u", inputU);
        // 会議室読み込みは初回呼び出し時でもいいかも
        $(document).on("keydown", null, "m", inputM);
        // rキーはただのリロード
        $(document).on("keydown", null, "r", function() {
            location.reload()
        });
        createViewArea();
        moveCursor(0);
    };

    // start
    main();
})(grn);


