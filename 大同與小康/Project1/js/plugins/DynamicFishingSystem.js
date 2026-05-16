//=============================================================================
// DynamicFishingSystem.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.2.0] 動態釣魚系統 ― 類《釣魚王傳奇》的互動式釣魚小遊戲
 * @author Claude (AI-Assisted)
 * @url
 *
 * @help
 * ============================================================================
 *  動態釣魚系統 (Dynamic Fishing System) v1.2.0
 * ============================================================================
 *
 * 【功能簡介】
 *   提供一個完整的互動式釣魚小遊戲，包含四個階段：
 *   1. 投竿等待  ── 隨機等候魚兒咬鉤的時間
 *   2. 咬鉤時機  ── 在限定時窗內按下確認鍵
 *   3. 拉竿遊戲  ── 移動游標保持在魚兒游動的綠色目標區
 *   4. 結果畫面  ── 顯示釣果並自動發放道具
 *
 * ============================================================================
 * 【遊戲操作說明】
 *   投竿等待：   - 按 Escape / Cancel 取消釣魚
 *   咬鉤判定：   - 出現「！」時立刻按 確認鍵（Enter/Z/Space/觸碰）
 *   拉竿遊戲：   - ← / → 或 Q / W  移動游標
 *               - 觸碰畫面左半部 / 右半部 也可移動游標
 *               - 游標保持在【綠色區域】內 → 進度增加、張力下降
 *               - 游標跑出綠色區域  → 進度流失、張力上升
 *               - 張力條滿（100%）  → 魚線斷裂，釣魚失敗
 *               - 進度條滿（100%）  → 釣魚成功！
 *
 * ============================================================================
 * 【插件指令】
 *   ► StartFishing（開始釣魚）
 *       spotGroupId: 指定魚種群組 ID，填 0 則沿用當前設定值
 *
 *   ► SetFishingSpot（設定釣魚點）
 *       groupId: 設定當前地圖使用的魚種群組 ID
 *
 * 【腳本呼叫】
 *   $gameSystem.fishingSpotGroupId = N;   // 切換釣魚點群組
 *   $gameSystem.getLastFishingResult();    // 取得上次結果物件
 *                                          // { success:bool, fish:Object|null }
 *
 * ============================================================================
 * 【結果變數說明】
 *   結果變數：  0=取消/失敗  1=成功  2=咬鉤錯過/跑魚
 *   魚種變數：  成功時為魚種 ID，其餘為 0
 *
 * ============================================================================
 * 【魚種群組 fishEntries 格式】
 *   以 JSON 字串陣列填入，每項格式為：
 *   {"fishId":"1","weight":"70"}
 *   weight 為加權比例（數字越大越常出現）
 *
 * ============================================================================
 * 【版本紀錄】
 *   v1.0.0 - 初始版本
 *   v1.1.0 - 新增觸碰操作、張力危險區標示、魚種稀有度顏色
 *   v1.2.0 - 新增掙扎機制、結果特效、閃爍動畫、多段難度曲線
 *
 * ============================================================================
 *
 * @param ─────────────────────────────
 * @text ── 魚種 & 地圖資料 ──
 *
 * @param FishDatabase
 * @text 魚種資料庫
 * @type struct<FishData>[]
 * @desc 定義所有可釣的魚種。每條魚必須有唯一的 id。
 * @default ["{\"id\":\"1\",\"name\":\"小鯽魚\",\"itemId\":\"1\",\"rarity\":\"common\",\"weight\":\"0.3\",\"difficulty\":\"1\",\"fishSpeed\":\"2.0\",\"fishStrength\":\"1.0\",\"escapeTendency\":\"0.2\",\"biteWindow\":\"2.0\",\"icon\":\"352\",\"catchMessage\":\"釣到了一條小鯽魚！雖然不大，但也不錯！\"}","{\"id\":\"2\",\"name\":\"鯉魚\",\"itemId\":\"2\",\"rarity\":\"uncommon\",\"weight\":\"2.5\",\"difficulty\":\"4\",\"fishSpeed\":\"4.5\",\"fishStrength\":\"3.5\",\"escapeTendency\":\"0.45\",\"biteWindow\":\"1.5\",\"icon\":\"353\",\"catchMessage\":\"好大的鯉魚！牠的掙扎讓人心跳加速！\"}","{\"id\":\"3\",\"name\":\"黑鱸\",\"itemId\":\"3\",\"rarity\":\"rare\",\"weight\":\"5.2\",\"difficulty\":\"6\",\"fishSpeed\":\"6.5\",\"fishStrength\":\"5.5\",\"escapeTendency\":\"0.6\",\"biteWindow\":\"1.2\",\"icon\":\"354\",\"catchMessage\":\"哇！釣到了難纏的黑鱸！真是高手！\"}","{\"id\":\"4\",\"name\":\"傳說龍魚\",\"itemId\":\"4\",\"rarity\":\"legendary\",\"weight\":\"18.0\",\"difficulty\":\"9\",\"fishSpeed\":\"9.0\",\"fishStrength\":\"8.0\",\"escapeTendency\":\"0.8\",\"biteWindow\":\"0.7\",\"icon\":\"355\",\"catchMessage\":\"難以置信！傳說中的龍魚就在你的魚竿上！！！\"}"]
 *
 * @param FishSpotGroups
 * @text 釣魚點群組設定
 * @type struct<FishSpotGroup>[]
 * @desc 定義不同釣魚點出現的魚種組合（以加權隨機抽取）。
 * @default ["{\"groupId\":\"1\",\"groupName\":\"新手河流\",\"fishEntries\":\"[\\\"{\\\\\\\"fishId\\\\\\\":\\\\\\\"1\\\\\\\",\\\\\\\"weight\\\\\\\":\\\\\\\"80\\\\\\\"}\\\",\\\"{\\\\\\\"fishId\\\\\\\":\\\\\\\"2\\\\\\\",\\\\\\\"weight\\\\\\\":\\\\\\\"20\\\\\\\"}\\\"]\"}", "{\"groupId\":\"2\",\"groupName\":\"深山秘湖\",\"fishEntries\":\"[\\\"{\\\\\\\"fishId\\\\\\\":\\\\\\\"2\\\\\\\",\\\\\\\"weight\\\\\\\":\\\\\\\"50\\\\\\\"}\\\",\\\"{\\\\\\\"fishId\\\\\\\":\\\\\\\"3\\\\\\\",\\\\\\\"weight\\\\\\\":\\\\\\\"40\\\\\\\"}\\\",\\\"{\\\\\\\"fishId\\\\\\\":\\\\\\\"4\\\\\\\",\\\\\\\"weight\\\\\\\":\\\\\\\"10\\\\\\\"}\\\"]\"}" ]
 *
 * @param DefaultSpotGroupId
 * @text 預設釣魚點群組 ID
 * @type number
 * @min 1
 * @desc 未透過指令指定時，使用此群組 ID。
 * @default 1
 *
 * @param ─────────────────────────────
 * @text ── 遊戲時間參數 ──
 *
 * @param WaitTimeMin
 * @text 最短等待時間（秒）
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 30
 * @desc 投竿後魚兒咬鉤前的最短等待時間。
 * @default 2.0
 *
 * @param WaitTimeMax
 * @text 最長等待時間（秒）
 * @type number
 * @decimals 1
 * @min 1
 * @max 60
 * @desc 投竿後魚兒咬鉤前的最長等待時間。
 * @default 7.0
 *
 * @param ReelDuration
 * @text 拉竿時間上限（秒）
 * @type number
 * @decimals 1
 * @min 5
 * @max 120
 * @desc 拉竿小遊戲超過此時間視為失敗。
 * @default 20.0
 *
 * @param ─────────────────────────────
 * @text ── 拉竿遊戲數值 ──
 *
 * @param ProgressFillRate
 * @text 進度填充速率（/秒）
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 50
 * @desc 游標在目標區時，每秒增加的進度量（0~100）。
 * @default 10.0
 *
 * @param ProgressDecayRate
 * @text 進度衰退速率（/秒）
 * @type number
 * @decimals 1
 * @min 0.1
 * @max 20
 * @desc 游標不在目標區時，每秒減少的進度量。
 * @default 5.0
 *
 * @param TensionRiseRate
 * @text 張力上升速率（/秒）
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 50
 * @desc 游標不在目標區時，每秒增加的張力量（0~100）。
 * @default 12.0
 *
 * @param TensionDecayRate
 * @text 張力恢復速率（/秒）
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 50
 * @desc 游標在目標區時，每秒減少的張力量。
 * @default 8.0
 *
 * @param CursorSpeed
 * @text 游標移動速度
 * @type number
 * @decimals 3
 * @min 0.005
 * @max 0.1
 * @desc 每幀游標移動量（0~1 的相對值）。建議 0.012~0.025。
 * @default 0.018
 *
 * @param ─────────────────────────────
 * @text ── 變數設定 ──
 *
 * @param ResultVariableId
 * @text 結果變數 ID
 * @type variable
 * @desc 儲存結果：0=取消/失敗  1=成功  2=跑魚/錯過
 * @default 1
 *
 * @param CaughtFishVariableId
 * @text 釣到魚種變數 ID
 * @type variable
 * @desc 成功時存入魚種 ID，其他情況存 0。
 * @default 2
 *
 * @param ─────────────────────────────
 * @text ── 音效設定 ──
 *
 * @param EnableSE
 * @text 啟用音效
 * @type boolean
 * @on 啟用
 * @off 停用
 * @desc 是否播放釣魚相關音效。
 * @default true
 *
 * @param BiteSE
 * @text 咬鉤音效
 * @type struct<AudioSE>
 * @desc 魚兒咬鉤瞬間播放。
 * @default {"name":"Bell3","volume":"90","pitch":"120","pan":"0"}
 *
 * @param CatchSE
 * @text 成功音效
 * @type struct<AudioSE>
 * @desc 成功釣到魚時播放。
 * @default {"name":"Item3","volume":"90","pitch":"100","pan":"0"}
 *
 * @param EscapeSE
 * @text 失敗音效
 * @type struct<AudioSE>
 * @desc 魚跑掉或魚線斷裂時播放。
 * @default {"name":"Miss","volume":"80","pitch":"80","pan":"0"}
 *
 * @param ─────────────────────────────
 * @text ── 介面設定 ──
 *
 * @param WindowSkin
 * @text 視窗外觀
 * @type file
 * @dir img/system
 * @desc 釣魚 UI 使用的 WindowSkin 檔案。留空則沿用預設。
 * @default
 *
 * @command StartFishing
 * @text 開始釣魚
 * @desc 啟動釣魚小遊戲。
 *
 * @arg spotGroupId
 * @text 魚種群組 ID
 * @type number
 * @min 0
 * @desc 使用哪個魚種群組（0 = 沿用當前設定或預設值）。
 * @default 0
 *
 * @command SetFishingSpot
 * @text 設定釣魚點群組
 * @desc 設定當前地圖釣魚點使用的魚種群組。
 *
 * @arg groupId
 * @text 群組 ID
 * @type number
 * @min 1
 * @desc 要切換到的釣魚點魚種群組 ID。
 * @default 1
 */

/*~struct~FishData:
 * @param id
 * @text 魚種 ID
 * @type number
 * @desc 唯一識別碼，不可重複。
 * @default 1
 *
 * @param name
 * @text 名稱
 * @type string
 * @desc 魚的顯示名稱。
 * @default 小魚
 *
 * @param itemId
 * @text 獲得道具 ID
 * @type item
 * @desc 釣到後自動獲得的道具（$dataItems 的 ID）。
 * @default 1
 *
 * @param rarity
 * @text 稀有度
 * @type select
 * @option 普通 (Common)
 * @value common
 * @option 稀有 (Uncommon)
 * @value uncommon
 * @option 罕見 (Rare)
 * @value rare
 * @option 傳說 (Legendary)
 * @value legendary
 * @desc 影響名稱顯示顏色。
 * @default common
 *
 * @param weight
 * @text 重量（kg）
 * @type number
 * @decimals 2
 * @desc 顯示在結果畫面的重量數值。
 * @default 0.5
 *
 * @param difficulty
 * @text 難度等級（1~10）
 * @type number
 * @min 1
 * @max 10
 * @desc 影響目標區大小與掙扎頻率。
 * @default 1
 *
 * @param fishSpeed
 * @text 游動速度
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 20
 * @desc 拉竿遊戲中目標區的基礎移動速度。
 * @default 3.0
 *
 * @param fishStrength
 * @text 力量（影響張力上升）
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 10
 * @desc 這條魚對張力條施加的壓力係數。
 * @default 2.0
 *
 * @param escapeTendency
 * @text 逃跑傾向（0~1）
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @desc 魚掙扎時突然加速的機率。
 * @default 0.3
 *
 * @param biteWindow
 * @text 咬鉤時窗（秒）
 * @type number
 * @decimals 1
 * @min 0.3
 * @max 5
 * @desc 玩家必須在此秒數內按確認鍵，否則魚跑掉。
 * @default 1.5
 *
 * @param icon
 * @text 圖示 Index
 * @type number
 * @desc 結果畫面顯示的圖示（IconSet 索引值）。
 * @default 352
 *
 * @param catchMessage
 * @text 釣到提示訊息
 * @type string
 * @desc 成功時顯示在結果畫面下方的文字。
 * @default 釣到了一條魚！
 */

/*~struct~FishSpotGroup:
 * @param groupId
 * @text 群組 ID
 * @type number
 * @desc 唯一識別碼。
 * @default 1
 *
 * @param groupName
 * @text 群組名稱
 * @type string
 * @desc 釣魚地點的名稱（目前版本僅作備忘用）。
 * @default 釣魚點
 *
 * @param fishEntries
 * @text 魚種清單（JSON 字串陣列）
 * @type string[]
 * @desc 格式：{"fishId":"1","weight":"70"}。weight 為加權比例。
 * @default []
 */

/*~struct~AudioSE:
 * @param name
 * @text 音效檔名
 * @type file
 * @dir audio/se
 * @default
 *
 * @param volume
 * @text 音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param pitch
 * @text 音調
 * @type number
 * @min 50
 * @max 150
 * @default 100
 *
 * @param pan
 * @text 聲道偏移
 * @type number
 * @min -100
 * @max 100
 * @default 0
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "DynamicFishingSystem";

    // =========================================================================
    // § 0  參數解析
    // =========================================================================
    const rawParams = PluginManager.parameters(PLUGIN_NAME);

    const Params = {
        fishDatabase:       _parseStructArray(rawParams.FishDatabase),
        fishSpotGroups:     _parseStructArray(rawParams.FishSpotGroups),
        defaultSpotGroupId: Number(rawParams.DefaultSpotGroupId  || 1),
        waitTimeMin:        Number(rawParams.WaitTimeMin          || 2.0),
        waitTimeMax:        Number(rawParams.WaitTimeMax          || 7.0),
        reelDuration:       Number(rawParams.ReelDuration         || 20.0),
        progressFillRate:   Number(rawParams.ProgressFillRate     || 10.0),
        progressDecayRate:  Number(rawParams.ProgressDecayRate    || 5.0),
        tensionRiseRate:    Number(rawParams.TensionRiseRate      || 12.0),
        tensionDecayRate:   Number(rawParams.TensionDecayRate     || 8.0),
        cursorSpeed:        Number(rawParams.CursorSpeed          || 0.018),
        resultVariableId:   Number(rawParams.ResultVariableId     || 1),
        caughtFishVarId:    Number(rawParams.CaughtFishVariableId || 2),
        enableSE:           rawParams.EnableSE !== "false",
        biteSE:             _parseSE(rawParams.BiteSE),
        catchSE:            _parseSE(rawParams.CatchSE),
        escapeSE:           _parseSE(rawParams.EscapeSE),
        windowSkin:         rawParams.WindowSkin || "",
    };

    function _parseStructArray(raw) {
        try { return JSON.parse(raw || "[]").map(s => JSON.parse(s)); }
        catch(e) { return []; }
    }
    function _parseSE(raw) {
        try { return JSON.parse(raw || "{}"); }
        catch(e) { return {}; }
    }

    // =========================================================================
    // § 1  Bitmap 補強（strokeRect / drawLine）
    // =========================================================================
    // RMMZ 標準 Bitmap 無 strokeRect；僅在不存在時注入
    if (!Bitmap.prototype.strokeRect) {
        Bitmap.prototype.strokeRect = function(x, y, w, h, color, lw) {
            const ctx = this._context;
            ctx.save();
            ctx.strokeStyle = color || "#ffffff";
            ctx.lineWidth   = lw    || 1;
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
            this._baseTexture.update();
        };
    }
    if (!Bitmap.prototype.drawLine) {
        Bitmap.prototype.drawLine = function(x1, y1, x2, y2, color, lw) {
            const ctx = this._context;
            ctx.save();
            ctx.strokeStyle = color || "#ffffff";
            ctx.lineWidth   = lw    || 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
            this._baseTexture.update();
        };
    }

    // =========================================================================
    // § 2  工具函式（FishingUtil）
    // =========================================================================
    const FishingUtil = {

        getFishById(id) {
            return Params.fishDatabase.find(f => String(f.id) === String(id)) || null;
        },

        getSpotGroup(gid) {
            return Params.fishSpotGroups.find(g => String(g.groupId) === String(gid)) || null;
        },

        /** 加權隨機抽魚，回傳魚種物件或 null */
        rollFish(groupId) {
            const grp = this.getSpotGroup(groupId);
            if (!grp) return null;

            let entries;
            try { entries = JSON.parse(grp.fishEntries || "[]").map(e => JSON.parse(e)); }
            catch(e) { entries = []; }
            if (!entries.length) return null;

            const total = entries.reduce((s, e) => s + Number(e.weight || 1), 0);
            let rnd = Math.random() * total;
            for (const e of entries) {
                rnd -= Number(e.weight || 1);
                if (rnd <= 0) return this.getFishById(e.fishId);
            }
            return this.getFishById(entries[entries.length - 1].fishId);
        },

        playSE(se) {
            if (!Params.enableSE || !se || !se.name) return;
            AudioManager.playSe({
                name:   se.name,
                volume: Number(se.volume || 90),
                pitch:  Number(se.pitch  || 100),
                pan:    Number(se.pan    || 0),
            });
        },

        rarityColor(r) {
            return { legendary:"#FFD700", rare:"#CC66FF", uncommon:"#55CCFF" }[r] || "#FFFFFF";
        },

        rarityLabel(r) {
            return { legendary:"【傳說】", rare:"【罕見】", uncommon:"【稀有】" }[r] || "【普通】";
        },

        /** 線性插值 */
        lerp(a, b, t) { return a + (b - a) * t; },

        /** 16 進位顏色 → RGB 物件 */
        hexToRGB(hex) {
            const r = parseInt(hex.slice(1,3),16);
            const g = parseInt(hex.slice(3,5),16);
            const b = parseInt(hex.slice(5,7),16);
            return { r, g, b };
        },

        /** 兩顏色漸層 */
        lerpColor(c1, c2, t) {
            const a = this.hexToRGB(c1), b = this.hexToRGB(c2);
            const ri = Math.round(this.lerp(a.r, b.r, t));
            const gi = Math.round(this.lerp(a.g, b.g, t));
            const bi = Math.round(this.lerp(a.b, b.b, t));
            return `rgb(${ri},${gi},${bi})`;
        },
    };

    // =========================================================================
    // § 3  Game_System 擴充（保存釣魚狀態用）
    // =========================================================================
    const _GS_init = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _GS_init.call(this);
        this.fishingSpotGroupId   = Params.defaultSpotGroupId;
        this._lastFishingResult   = null;
    };
    Game_System.prototype.setLastFishingResult = function(r) { this._lastFishingResult = r; };
    Game_System.prototype.getLastFishingResult  = function()  { return this._lastFishingResult; };

    // =========================================================================
    // § 4  Plugin Commands
    // =========================================================================
    PluginManager.registerCommand(PLUGIN_NAME, "StartFishing", args => {
        const gid = Number(args.spotGroupId) || 0;
        Scene_Fishing._initGroupId = gid > 0 ? gid
            : ($gameSystem.fishingSpotGroupId || Params.defaultSpotGroupId);
        SceneManager.push(Scene_Fishing);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "SetFishingSpot", args => {
        $gameSystem.fishingSpotGroupId = Number(args.groupId) || Params.defaultSpotGroupId;
    });

    // =========================================================================
    // § 5  Scene_Fishing（主場景）
    // =========================================================================
    class Scene_Fishing extends Scene_Base {

        static get _initGroupId() { return Scene_Fishing.__initGroupId || Params.defaultSpotGroupId; }
        static set _initGroupId(v){ Scene_Fishing.__initGroupId = v; }

        //  ── 生命週期 ──────────────────────────────────────────────────────
        create() {
            super.create();
            this._groupId    = Scene_Fishing._initGroupId;
            this._phase      = "init";
            this._targetFish = null;
            this._waitTimer  = 0;
            this._waitTarget = 0;
            this._biteTimer  = 0;

            this._createBG();
            this._createWaterAnimation();
        }

        start() {
            super.start();
            this._startCastPhase();
        }

        update() {
            super.update();
            this._updateWaterAnimation();

            switch (this._phase) {
                case "cast":   this._updateCast();   break;
                case "bite":   this._updateBite();   break;
                case "reel":   this._updateReel();   break;
                case "result": this._updateResult(); break;
            }
        }

        terminate() {
            super.terminate();
        }

        //  ── 背景 & 水面動畫 ──────────────────────────────────────────────
        _createBG() {
            // 半透明黑底
            const bg = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            bg.bitmap.fillAll("rgba(0,20,40,0.82)");
            this.addChild(bg);
        }

        _createWaterAnimation() {
            // 用多行文字模擬水紋
            this._waterSprite = new Sprite(new Bitmap(Graphics.width, 60));
            this._waterSprite.y = Graphics.height - 70;
            this._waterFrame = 0;
            this.addChild(this._waterSprite);
        }

        _updateWaterAnimation() {
            this._waterFrame++;
            if (this._waterFrame % 8 !== 0) return;
            const bm = this._waterSprite.bitmap;
            bm.clear();
            const waves = ["≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈",
                           "～～～～～～～～～～～～～～～～～～～～"];
            const idx   = Math.floor(this._waterFrame / 8) % 2;
            bm.fontSize = 22;
            bm.textColor = "#3388CC";
            bm.drawText(waves[idx], 0, 0, Graphics.width, 40, "center");
            bm.fontSize = 18;
            bm.textColor = "#2266AA";
            bm.drawText(waves[1 - idx], 0, 22, Graphics.width, 40, "center");
        }

        //  ── 投竿階段 ─────────────────────────────────────────────────────
        _startCastPhase() {
            this._phase      = "cast";
            this._targetFish = FishingUtil.rollFish(this._groupId);
            const minF       = Params.waitTimeMin * 60;
            const maxF       = Params.waitTimeMax * 60;
            this._waitTarget = Math.floor(minF + Math.random() * (maxF - minF));
            this._waitTimer  = 0;

            this._castWin = new Window_FishingCast();
            this.addChild(this._castWin);
        }

        _updateCast() {
            this._waitTimer++;
            this._castWin.updateDots(this._waitTimer);

            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
                this._exit("cancel");
                return;
            }
            if (this._waitTimer >= this._waitTarget) {
                this._startBitePhase();
            }
        }

        //  ── 咬鉤階段 ─────────────────────────────────────────────────────
        _startBitePhase() {
            this._phase = "bite";
            const fish  = this._targetFish;
            this._biteMax   = Math.floor((fish ? Number(fish.biteWindow) : 1.5) * 60);
            this._biteTimer = this._biteMax;
            this._castWin.showBiteMode();
            FishingUtil.playSE(Params.biteSE);
        }

        _updateBite() {
            this._biteTimer--;
            this._castWin.updateBiteBar(this._biteTimer, this._biteMax);

            if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
                this._startReelPhase();
                return;
            }
            if (this._biteTimer <= 0) {
                this._exit("missed");
            }
        }

        //  ── 拉竿階段 ─────────────────────────────────────────────────────
        _startReelPhase() {
            this._phase = "reel";
            if (this._castWin) { this._castWin.hide(); }

            this._reelWin = new Window_FishingReel(this._targetFish);
            this.addChild(this._reelWin);
        }

        _updateReel() {
            if (!this._reelWin) return;
            this._reelWin.tick();

            const st = this._reelWin.status;
            if (st === "caught")  this._startResultPhase(true);
            if (st === "escaped") this._startResultPhase(false);
        }

        //  ── 結果階段 ─────────────────────────────────────────────────────
        _startResultPhase(success) {
            this._phase = "result";
            if (this._reelWin) { this._reelWin.visible = false; }

            const fish = success ? this._targetFish : null;

            // 發放道具
            if (success && fish && fish.itemId) {
                $gameParty.gainItem($dataItems[Number(fish.itemId)], 1);
            }

            // 寫入變數
            $gameVariables.setValue(Params.resultVariableId, success ? 1 : 2);
            $gameVariables.setValue(Params.caughtFishVarId,  success && fish ? Number(fish.id) : 0);
            $gameSystem.setLastFishingResult({ success, fish });

            // 音效
            FishingUtil.playSE(success ? Params.catchSE : Params.escapeSE);

            this._resultWin   = new Window_FishingResult(success, fish);
            this._resultTimer = 0;
            this.addChild(this._resultWin);
        }

        _updateResult() {
            this._resultTimer++;
            this._resultWin.tick(this._resultTimer);

            const canExit = this._resultTimer > 60;
            if (canExit && (
                Input.isTriggered("ok") ||
                Input.isTriggered("cancel") ||
                TouchInput.isTriggered()
            )) {
                this._exit("done");
            }
        }

        //  ── 離開場景 ─────────────────────────────────────────────────────
        _exit(reason) {
            if (reason === "cancel") {
                $gameVariables.setValue(Params.resultVariableId, 0);
                $gameVariables.setValue(Params.caughtFishVarId,  0);
                $gameSystem.setLastFishingResult({ success: false, fish: null });
            }
            SceneManager.pop();
        }
    }

    // =========================================================================
    // § 6  Window_FishingCast（投竿等待 & 咬鉤提示視窗）
    // =========================================================================
    class Window_FishingCast extends Window_Base {

        constructor() {
            const ww = 420, wh = 200;
            super(new Rectangle(
                (Graphics.width  - ww) / 2,
                (Graphics.height - wh) / 2 - 40,
                ww, wh
            ));
            this._biteMode    = false;
            this._frame       = 0;
            this._biteTimer   = 0;
            this._biteMax     = 90;
            if (Params.windowSkin) this.windowskin = ImageManager.loadSystem(Params.windowSkin);
            this._draw();
        }

        // ── 投竿等候階段呼叫 ──
        updateDots(frame) {
            if (this._biteMode) return;
            this._frame = frame;
            this._draw();
        }

        // ── 切換到咬鉤提示 ──
        showBiteMode() {
            this._biteMode = true;
            this._draw();
        }

        updateBiteBar(timer, max) {
            this._biteTimer = timer;
            this._biteMax   = max;
            this._draw();
        }

        _draw() {
            this.contents.clear();
            this._biteMode ? this._drawBite() : this._drawWait();
        }

        _drawWait() {
            const dots  = "．".repeat((Math.floor(this._frame / 18) % 3) + 1);
            const wave  = ["≈", "≈≈", "≈≈≈", "≈≈", "≈"][Math.floor(this._frame / 10) % 5];
            const iw    = this.innerWidth;

            // 標題
            this.contents.fontSize = 24;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("🎣  釣魚中", 0, 0, iw, "center");

            // 等候文字
            this.contents.fontSize = 20;
            this.resetTextColor();
            this.drawText("等待魚兒上鉤" + dots, 0, 44, iw, "center");

            // 水波
            this.contents.fontSize = 28;
            this.changeTextColor("#55AADD");
            this.drawText(wave, 0, 90, iw, "center");

            // 取消提示
            this.contents.fontSize = 13;
            this.changeTextColor("#666666");
            this.drawText("按 Esc 取消釣魚", 0, 152, iw, "center");

            this._resetFont();
        }

        _drawBite() {
            const iw = this.innerWidth;
            // 閃爍感歎號
            const flash = Math.floor(this._biteMax - this._biteTimer);
            const alpha  = flash % 8 < 4 ? 1 : 0.2;

            this.contents.fontSize = 32;
            this.changeTextColor(`rgba(255,60,60,${alpha})`);
            this.drawText("！ 魚兒咬鉤了！！", 0, 0, iw, "center");

            this.contents.fontSize = 20;
            this.changeTextColor("#FFEE44");
            this.drawText("⬤  立刻按下確認鍵！  ⬤", 0, 46, iw, "center");

            // 咬鉤時窗條
            const ratio  = Math.max(0, this._biteTimer / (this._biteMax || 1));
            const barX   = 10, barY = 100, barW = iw - 20, barH = 18;
            const fillC  = ratio > 0.5 ? "#22DD44"
                         : ratio > 0.25 ? "#FFAA00" : "#FF2200";

            this.contents.fillRect(barX, barY, barW, barH, "#222222");
            this.contents.fillRect(barX, barY, Math.floor(barW * ratio), barH, fillC);
            this.contents.strokeRect(barX, barY, barW, barH, "#AAAAAA", 1);

            this.contents.fontSize = 13;
            this.changeTextColor("#888888");
            this.drawText("咬鉤時窗", barX, barY + barH + 4, 80, "left");

            this._resetFont();
        }

        _resetFont() {
            this.contents.fontSize = $gameSystem.mainFontSize();
            this.resetTextColor();
        }
    }

    // =========================================================================
    // § 7  Window_FishingReel（拉竿小遊戲主體）
    // =========================================================================
    class Window_FishingReel extends Window_Base {

        constructor(fish) {
            const ww = 540, wh = 310;
            super(new Rectangle(
                (Graphics.width  - ww) / 2,
                (Graphics.height - wh) / 2,
                ww, wh
            ));
            if (Params.windowSkin) this.windowskin = ImageManager.loadSystem(Params.windowSkin);

            this._fish      = fish || {};
            this.status     = "playing"; // playing / caught / escaped

            // ── 核心數值（0~100）──
            this._progress  = 0;
            this._tension   = 30;

            // ── 魚兒目標區 ──
            this._zonePos   = 0.5;  // 中心位置（0~1）
            this._zoneSize  = 0.3;  // 寬度（0~1）
            this._zoneVel   = 0;    // 當前速度
            this._zoneBaseSpeed = 0;

            // ── 游標 ──
            this._cursorPos = 0.5;
            this._cursorVel = 0;    // 慣性

            // ── 計時器 ──
            this._totalFrames  = Params.reelDuration * 60;
            this._elapsed      = 0;

            // ── 魚的掙扎 ──
            this._struggleTimer    = 0;
            this._struggleCooldown = 0;
            this._isStruggling     = false;

            this._initFishParams();
        }

        _initFishParams() {
            const f   = this._fish;
            const dif = Math.max(1, Math.min(10, Number(f.difficulty     || 1)));
            const spd = Number(f.fishSpeed    || 3);
            const str = Number(f.fishStrength || 2);

            // 難度越高，目標區越小
            this._zoneSize      = Math.max(0.08, 0.40 - dif * 0.028);
            // 每幀的基礎移動量
            this._zoneBaseSpeed = spd * 0.0025;
            this._zoneVel       = this._zoneBaseSpeed * (Math.random() < 0.5 ? 1 : -1);

            // 力量影響張力上升倍率
            this._strengthMult  = str / 3.0;

            // 掙扎間隔（幀）：難度高則掙扎更頻繁
            this._struggleInterval = Math.max(50, 200 - dif * 15);
        }

        //  ── 每幀更新（由 Scene 呼叫）────────────────────────────────────
        tick() {
            if (this.status !== "playing") return;

            this._elapsed++;
            if (this._elapsed > this._totalFrames) {
                this.status = "escaped";
                return;
            }

            this._tickFishZone();
            this._tickCursor();
            this._tickBars();
            this._checkWinLose();
            this._drawAll();
        }

        //  ── 魚兒目標區移動 ────────────────────────────────────────────
        _tickFishZone() {
            // 掙扎計時
            this._struggleTimer++;
            if (this._struggleCooldown > 0) this._struggleCooldown--;

            if (this._struggleTimer >= this._struggleInterval && this._struggleCooldown <= 0) {
                this._struggleTimer = 0;
                this._struggleCooldown = 40;
                this._isStruggling = true;

                // 隨機換方向 + 可能暴衝
                this._zoneVel = -this._zoneVel;
                if (Math.random() < Number(this._fish.escapeTendency || 0.3)) {
                    this._zoneVel *= 2.2; // 暴衝
                    setTimeout(() => { this._zoneVel /= 2.2; }, 400);
                }
            } else {
                this._isStruggling = false;
            }

            // 自然速度收斂
            const targetSpd = this._zoneBaseSpeed * Math.sign(this._zoneVel || 1);
            this._zoneVel += (targetSpd - this._zoneVel) * 0.04;

            this._zonePos += this._zoneVel;

            // 邊界碰撞反彈
            const half = this._zoneSize / 2;
            if (this._zonePos - half < 0) {
                this._zonePos = half;
                this._zoneVel = Math.abs(this._zoneVel);
            }
            if (this._zonePos + half > 1) {
                this._zonePos = 1 - half;
                this._zoneVel = -Math.abs(this._zoneVel);
            }
        }

        //  ── 游標控制 ──────────────────────────────────────────────────
        _tickCursor() {
            const spd = Params.cursorSpeed;
            let acc = 0;

            if (Input.isPressed("left")  || Input.isPressed("pageup"))   acc -= 1;
            if (Input.isPressed("right") || Input.isPressed("pagedown")) acc += 1;

            // 觸碰支援
            if (TouchInput.isPressed()) {
                const mid = Graphics.width / 2;
                acc += (TouchInput.x < mid) ? -1 : 1;
            }

            // 慣性
            this._cursorVel += acc * spd * 0.6;
            this._cursorVel *= 0.75; // 摩擦
            this._cursorPos += this._cursorVel;
            this._cursorPos  = Math.max(0, Math.min(1, this._cursorPos));
        }

        //  ── 進度條 & 張力條 ────────────────────────────────────────────
        _tickBars() {
            const dt      = 1 / 60;
            const inZone  = this._inZone();
            const fishStr = this._strengthMult;

            if (inZone) {
                this._progress = Math.min(100,
                    this._progress + Params.progressFillRate * dt);
                this._tension  = Math.max(0,
                    this._tension - Params.tensionDecayRate * dt);
            } else {
                this._progress = Math.max(0,
                    this._progress - Params.progressDecayRate * dt);
                this._tension  = Math.min(100,
                    this._tension + Params.tensionRiseRate * fishStr * dt);
            }
        }

        _inZone() {
            const h = this._zoneSize / 2;
            return this._cursorPos >= this._zonePos - h &&
                   this._cursorPos <= this._zonePos + h;
        }

        //  ── 勝負判定 ──────────────────────────────────────────────────
        _checkWinLose() {
            if (this._progress >= 100) this.status = "caught";
            if (this._tension  >= 100) this.status = "escaped";
        }

        //  ── 繪製 ──────────────────────────────────────────────────────
        _drawAll() {
            this.contents.clear();
            this._drawHeader();
            this._drawFishBar();
            this._drawProgressBar();
            this._drawTensionBar();
            this._drawTimerAndHints();
        }

        _drawHeader() {
            const fish = this._fish;
            const iw   = this.innerWidth;
            const col  = FishingUtil.rarityColor(fish.rarity);
            const lbl  = FishingUtil.rarityLabel(fish.rarity);

            this.contents.fontSize = 20;
            this.changeTextColor(col);
            this.drawText(lbl + "  " + (fish.name || "???"), 0, 0, iw, "center");

            // 掙扎警示
            if (this._isStruggling) {
                this.contents.fontSize = 14;
                this.changeTextColor("#FF6622");
                this.drawText("⚠ 魚在掙扎！", iw - 120, 0, 120, "right");
            }
            this._resetFont();
        }

        /** 魚兒游動條（核心玩法區域） */
        _drawFishBar() {
            const iw   = this.innerWidth;
            const barX = 10, barY = 34, barW = iw - 20, barH = 60;

            // 背景（深水色）
            this.contents.fillRect(barX, barY, barW, barH, "#0a1a2e");

            // 目標區（綠色）
            const zL = barX + Math.floor((this._zonePos - this._zoneSize / 2) * barW);
            const zW = Math.floor(this._zoneSize * barW);
            this.contents.fillRect(zL, barY, zW, barH, "#1e8c3a");
            // 目標區亮邊
            this.contents.fillRect(zL, barY, zW, 4,    "#44FF88");
            this.contents.fillRect(zL, barY + barH - 4, zW, 4, "#44FF88");

            // 魚的符號在目標區中心
            const fishX = barX + Math.floor(this._zonePos * barW) - 10;
            this.contents.fontSize = 22;
            this.changeTextColor("#FFFFFF");
            this.drawText("🐟", fishX, barY + 16, 28, "left");

            // 游標（白色細條）
            const cX = barX + Math.floor(this._cursorPos * barW);
            const cH = barH + 10;
            this.contents.fillRect(cX - 3, barY - 5, 6, cH, "#FFFFFF");
            // 游標頂底三角指示器（用矩形組合）
            this.contents.fillRect(cX - 5, barY - 5, 10, 5, "#FFEE00");
            this.contents.fillRect(cX - 5, barY + barH, 10, 5, "#FFEE00");

            // 外框
            this.contents.strokeRect(barX, barY, barW, barH, "#336699", 2);

            // 操作提示文字
            this.contents.fontSize = 13;
            this.changeTextColor("#778899");
            this.drawText("← 左移", barX, barY + barH + 4, 60, "left");
            this.drawText("右移 →", barX + barW - 60, barY + barH + 4, 60, "right");

            this._resetFont();
        }

        _drawProgressBar() {
            const iw   = this.innerWidth;
            const barX = 10, barY = 136, barW = iw - 20, barH = 22;

            // Label
            this.contents.fontSize = 15;
            this.changeTextColor("#AACCFF");
            this.drawText("釣魚進度", barX, barY - 20, 100, "left");
            this.changeTextColor(this._progress >= 80 ? "#00FFCC" : "#FFFFFF");
            this.drawText(Math.floor(this._progress) + " %", barX + barW - 60, barY - 20, 60, "right");

            // 背景
            this.contents.fillRect(barX, barY, barW, barH, "#111122");

            // 進度填充（漸層模擬）
            const fw    = Math.floor(barW * this._progress / 100);
            const fillC = FishingUtil.lerpColor("#1155CC", "#00FFCC", this._progress / 100);
            this.contents.fillRect(barX, barY, fw, barH, fillC);

            // 高光
            if (fw > 6) {
                this.contents.fillRect(barX, barY, fw, Math.floor(barH * 0.45),
                    "rgba(255,255,255,0.12)");
            }

            // 邊框
            this.contents.strokeRect(barX, barY, barW, barH, "#4466AA", 1);
            this._resetFont();
        }

        _drawTensionBar() {
            const iw      = this.innerWidth;
            const barX = 10, barY = 200, barW = iw - 20, barH = 22;
            const t       = this._tension;
            const danger  = t >= 75;
            const critical = t >= 90;

            // Label
            this.contents.fontSize = 15;
            this.changeTextColor("#FFAABB");
            this.drawText("魚線張力", barX, barY - 20, 100, "left");

            const tensionLabel = critical ? "⚠ 即將斷裂！！"
                               : danger   ? "⚠ 危險！"
                               :            Math.floor(t) + " %";
            this.changeTextColor(critical ? "#FF1111" : danger ? "#FF8800" : "#FFFFFF");
            this.drawText(tensionLabel, barX + barW - 160, barY - 20, 160, "right");

            // 背景
            this.contents.fillRect(barX, barY, barW, barH, "#1a0000");

            // 張力填充（綠→橙→紅）
            const fw     = Math.floor(barW * t / 100);
            const fillC  = t < 40 ? "#22CC66"
                         : t < 70 ? FishingUtil.lerpColor("#CCAA00", "#FF6600", (t - 40) / 30)
                         :           FishingUtil.lerpColor("#FF4400", "#FF0000", (t - 70) / 30);
            this.contents.fillRect(barX, barY, fw, barH, fillC);

            // 高光
            if (fw > 6) {
                this.contents.fillRect(barX, barY, fw, Math.floor(barH * 0.45),
                    "rgba(255,255,255,0.10)");
            }

            // 75% 危險線
            const dangerX = barX + Math.floor(barW * 0.75);
            this.contents.fillRect(dangerX, barY - 4, 2, barH + 8, "#FF4400");
            this.contents.fontSize = 11;
            this.changeTextColor("#FF4400");
            this.drawText("危", dangerX - 8, barY - 18, 24, "center");

            // 邊框
            this.contents.strokeRect(barX, barY, barW, barH, "#882222", 1);
            this._resetFont();
        }

        _drawTimerAndHints() {
            const iw       = this.innerWidth;
            const timeLeft = Math.max(0, Math.ceil((this._totalFrames - this._elapsed) / 60));

            this.contents.fontSize = 14;
            this.changeTextColor(timeLeft <= 5 ? "#FF4444" : "#999999");
            this.drawText("⏱ 剩餘時間：" + timeLeft + " 秒", 0, 270, iw, "center");

            this._resetFont();
        }

        _resetFont() {
            this.contents.fontSize = $gameSystem.mainFontSize();
            this.resetTextColor();
        }
    }

    // =========================================================================
    // § 8  Window_FishingResult（結果畫面）
    // =========================================================================
    class Window_FishingResult extends Window_Base {

        constructor(success, fish) {
            const ww = 440, wh = 220;
            super(new Rectangle(
                (Graphics.width  - ww) / 2,
                (Graphics.height - wh) / 2,
                ww, wh
            ));
            if (Params.windowSkin) this.windowskin = ImageManager.loadSystem(Params.windowSkin);

            this._success = success;
            this._fish    = fish;
            this._frame   = 0;
            this._draw();
        }

        tick(frame) {
            this._frame = frame;
            this._draw();
        }

        _draw() {
            this.contents.clear();
            this._success ? this._drawSuccess() : this._drawFail();
        }

        _drawSuccess() {
            const fish  = this._fish || {};
            const iw    = this.innerWidth;
            const col   = FishingUtil.rarityColor(fish.rarity);

            // 標題閃爍（星號）
            const stars = this._frame % 20 < 10 ? "✨✨✨" : "⭐⭐⭐";
            this.contents.fontSize = 24;
            this.changeTextColor("#FFDD22");
            this.drawText(stars + "  釣魚成功！  " + stars, 0, 0, iw, "center");

            // 圖示 + 魚名
            this.contents.fontSize = 20;
            const iconId = Number(fish.icon || 0);
            if (iconId > 0) this.drawIcon(iconId, (iw / 2) - 80, 42);
            this.changeTextColor(col);
            this.drawText((fish.name || "???"), 0, 44, iw, "center");

            // 重量
            this.contents.fontSize = 16;
            this.resetTextColor();
            const wt = Number(fish.weight || 0);
            this.drawText("重量：" + wt.toFixed(2) + " kg", 0, 90, iw, "center");

            // 訊息
            this.changeTextColor("#99FFAA");
            this.drawText(fish.catchMessage || "釣到了！", 0, 120, iw, "center");

            // 繼續提示（延遲 60 幀後才顯示）
            if (this._frame > 60) {
                this.contents.fontSize = 13;
                this.changeTextColor("#555555");
                this.drawText("按任意鍵繼續", 0, 188, iw, "center");
            }
            this._resetFont();
        }

        _drawFail() {
            const iw = this.innerWidth;
            this.contents.fontSize = 26;
            this.changeTextColor("#FF5533");
            this.drawText("魚兒逃跑了…", 0, 20, iw, "center");

            this.contents.fontSize = 18;
            this.resetTextColor();

            const msgs = [
                "再接再厲！下次一定釣得到！",
                "功虧一簣…不要氣餒！",
                "這條魚太狡猾了，下次換你贏！",
            ];
            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            this.drawText(msg, 0, 80, iw, "center");

            if (this._frame > 60) {
                this.contents.fontSize = 13;
                this.changeTextColor("#555555");
                this.drawText("按任意鍵繼續", 0, 170, iw, "center");
            }
            this._resetFont();
        }

        _resetFont() {
            this.contents.fontSize = $gameSystem.mainFontSize();
            this.resetTextColor();
        }
    }

    // =========================================================================
    // § 9  全域掛載（供事件腳本直接 new 或呼叫）
    // =========================================================================
    window.Scene_Fishing         = Scene_Fishing;
    window.Window_FishingCast    = Window_FishingCast;
    window.Window_FishingReel    = Window_FishingReel;
    window.Window_FishingResult  = Window_FishingResult;
    window.FishingUtil           = FishingUtil;

})();
