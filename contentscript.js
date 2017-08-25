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
	var UNREAD_COUNT = 0;
	// うまくスクロールできないので少し引いた値に寄せる
	var SCROLL_MARGIN = 50;

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
		// スペース
		// TODO: 読み込み済にしているつもりがそうならない。。なぜだ。
		var $space = $("a[href^='/cgi-bin/cbgrn/grn.cgi/space/application/discussion/index']").find("img[src*='spaceDiscussion20_u.png']").parent();
		// スケジュール(event20_(new|edit|delete).gif)
		var $schedule = $("a[href^='/cgi-bin/cbgrn/grn.cgi/schedule/view']").find("img[src*='event20_']").parent();

        // 対象となるリンク先を全マージ
		// TODO: マージ順が「上から」ではなく、掲示板・スペース・スケジュール のようになってしまう違和感をなおしたい
        var $links = $.merge(modifiedLinks, unreadLinks);
		$links = $.merge($links, $space);
		$links = $.merge($links, $schedule);


        // 暫定で色をつける
        $links.css("backgroundColor", "#FCC");
		UNREAD_COUNT = $links.length;
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
		if (isViewAreaOpened()) {
			loadLink();
		}
    };
    /**
     * k キーを押した時のショートカット動作
     * 前の未読リンクへ移動
     */
    var inputK = function() {
        // TODO: 実装
        console.log("k pressed");
        moveCursor(-1);
		if (isViewAreaOpened()) {
			loadLink();
		}
    };

    /**
     * カーソルの移動
     * $LINKS の範囲の中で移動する
     */
    var moveCursor = function(n, mode) {
        console.log("move cursor", n, mode);
		if (typeof mode === "undefined") {
			mode = "move";
		}
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
        // 選択していることが分かるようにアクティブリンクの色を変える
		var active = $LINKS.get(SELECTED_INDEX);
        $(active).css("background-color", "#CCF");
		// ViewAreaが表示されていなければスクロールをカーソル位置にする
		if (!isViewAreaOpened() && mode === "move") {
			$("html,body").animate({scrollTop:$(active).parent().offset().top-SCROLL_MARGIN});
		}
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
		loadLink();

    };

	/**
	 * 描画エリアが開かれているかどうか
	 */
	var isViewAreaOpened = function() {
		return ($("#grn_extension_view_area").html().length !== 0)
	};

	/**
	 * 現在選択中のリンクをロードして表示する
	 */
	var loadLink = function() {
        var $a = $($LINKS.get(SELECTED_INDEX));
        console.log($a.attr("href"));
        $.ajax({
            url: $a.attr("href")
        })
        .done(function(data) {
			// TODO: スペースの場合なぜかHTMLの内容がうまくオブジェクト化できない
            var $html = $(data);
            // TODO: 下記のパターンは、ど新規ではなく更新差分があった場合の見方になる
			// TODO: ド新規の場合は更新差分はほぼなしになってしまうため
            var $unreads = $html.find(".unread_color");
			// すでに記事を開いている場合は一度中身を空にしてからとする
			if (isViewAreaOpened()) {
				resetViewArea();
			}
            $unreads.each(function() {
                $("#grn_extension_view_area").append($(this).html() + '<div class="border-partition-follow-grn"></div>');
            });
			// TODO: 同じ記事を読みに行った場合はデクリメントしない
			// TODO: もし0件になったらリロードを促すなどする
			// TODO: デクリメントではなく最初に取得したlinksからspliceしたほうが良いはず
			UNREAD_COUNT--;
			console.log("decrement UNREAD_COUNT:", UNREAD_COUNT);
			// 該当箇所へスクロール
			$("html,body").animate({scrollTop:$('#grn_extension_view_area').parent().offset().top-SCROLL_MARGIN});

        });
	};

    /**
     * 初期ロードでAjaxで読み込んだ内容を描画するフィールドを作成する
     */
    var createViewArea = function() {
        console.log("createViewArea");
        var area = '<div id="grn_extension_view_area" class="unread_color"/>';
		// TODO: 表示場所はここで良いのかは検討する
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
        moveCursor(0, "init");
    };

    // start
    main();
})(grn);


