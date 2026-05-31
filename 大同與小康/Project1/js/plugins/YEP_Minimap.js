/*:
 * @target MZ
 * @plugindesc [v1.1.0] 右上角小地圖 (Minimap) - 在畫面右上角顯示即時小地圖
 * @author RPG Maker MZ Plugin Dev
 * @url
 *
 * @param mapWidth
 * @text 小地圖寬度
 * @desc 小地圖的寬度（像素）
 * @type number
 * @min 50
 * @max 400
 * @default 200
 *
 * @param mapHeight
 * @text 小地圖高度
 * @desc 小地圖的高度（像素）
 * @type number
 * @min 50
 * @max 300
 * @default 150
 *
 * @param opacity
 * @text 整體透明度
 * @desc 小地圖整體的透明度（0=完全透明，255=完全不透明）
 * @type number
 * @min 0
 * @max 255
 * @default 200
 *
 * @param playerColor
 * @text 玩家標記顏色
 * @desc 玩家在小地圖上的標記顏色（支援 Hex 色碼，例如 #00FF00）
 * @type string
 * @default #00FF00
 *
 * @param eventColor
 * @text 事件標記顏色
 * @desc 事件在小地圖上的標記顏色（支援 Hex 色碼，例如 #FF0000）
 * @type string
 * @default #FF0000
 *
 * @param switchId
 * @text 控制開關 ID
 * @desc 用來控制小地圖顯示/隱藏的開關 ID，設為 0 表示永遠顯示
 * @type switch
 * @default 0
 *
 * @param marginX
 * @text 右側邊距
 * @desc 小地圖距離畫面右側的邊距（像素）
 * @type number
 * @min 0
 * @max 100
 * @default 10
 *
 * @param marginY
 * @text 頂部邊距
 * @desc 小地圖距離畫面頂部的邊距（像素）
 * @type number
 * @min 0
 * @max 100
 * @default 10
 *
 * @param borderColor
 * @text 外框顏色
 * @desc 小地圖外框的顏色（支援 Hex 色碼）
 * @type string
 * @default #FFFFFF
 *
 * @param borderWidth
 * @text 外框寬度
 * @desc 小地圖外框的線條寬度（像素）
 * @type number
 * @min 0
 * @max 10
 * @default 1
 *
 * @param walkableColor
 * @text 牆壁顏色
 * @desc 不可通行地形（牆壁/障礙）在小地圖上的顏色（支援 Hex 色碼）
 * @type string
 * @default #888888
 *
 * @command markEvent
 * @text 標記事件到小地圖
 * @desc 將指定事件 ID 加入小地圖白名單，該事件會顯示紅點。
 *
 * @arg eventId
 * @text 事件 ID
 * @desc 要標記的事件 ID（填入地圖上的事件編號）
 * @type number
 * @min 1
 * @default 1
 *
 * @command unmarkEvent
 * @text 取消標記事件
 * @desc 將指定事件 ID 從小地圖白名單移除，該事件不再顯示紅點。
 *
 * @arg eventId
 * @text 事件 ID
 * @desc 要取消標記的事件 ID
 * @type number
 * @min 1
 * @default 1
 *
 * @command clearAllMarks
 * @text 清除所有標記
 * @desc 清除目前地圖上所有事件的小地圖標記（白名單清空）。
 *
 * @help
 * ============================================================================
 * 右上角小地圖插件 (Minimap) v1.1.0
 * ============================================================================
 *
 * 【功能說明】
 * 本插件會在地圖畫面的右上角顯示一個即時小地圖，包含：
 *   - 灰色區塊代表不可行走的地形（牆壁/障礙）
 *   - 黑色底色代表可行走的通道
 *   - 綠色圓點代表玩家位置（預設）
 *   - 紅色圓點代表被手動標記的特定事件位置
 *
 * 【效能設計】
 * 採用雙層畫布設計：
 *   底層（地形層）：只在進入新地圖時渲染一次，不浪費效能。
 *   動態層（標記層）：每幀更新玩家與事件的即時位置。
 *
 * 【事件標記機制（白名單模式）】
 * 預設情況下，所有事件都「不會」顯示在小地圖上。
 * 只有透過插件指令手動標記的事件，才會出現紅點。
 *
 *   ★ 標記事件到小地圖
 *     → 編輯器：外掛指令 > Minimap > 標記事件到小地圖
 *     → 參數：事件 ID（填入要顯示紅點的事件編號）
 *
 *   ★ 取消標記事件
 *     → 編輯器：外掛指令 > Minimap > 取消標記事件
 *     → 參數：事件 ID（填入要隱藏紅點的事件編號）
 *
 *   ★ 清除所有標記
 *     → 編輯器：外掛指令 > Minimap > 清除所有標記
 *     → 將目前地圖的白名單全部清空
 *
 * 【使用範例】
 * 假設地圖上有 NPC（事件 ID = 3）和許多動畫事件（ID = 5,6,7）：
 * 1. 建立一個「自動執行」的事件，加入指令：
 *    「外掛指令 > 標記事件到小地圖」，事件 ID 填 3。
 * 2. 只有 ID=3 的 NPC 會顯示紅點，動畫事件完全不會出現在小地圖上。
 *
 * 【注意事項】
 * - 白名單資料以「地圖 ID」為單位分開儲存。
 * - 換地圖後白名單自動清除，請在進入地圖時重新呼叫標記指令。
 * - 被標記的事件若被刪除或頁面條件不符，紅點會自動消失。
 *
 * 【開關控制使用方式】
 * 1. 在插件參數中設定「控制開關 ID」，例如設為 10
 * 2. 在事件指令中使用「控制開關」將開關 10 設為 ON，小地圖出現
 * 3. 將開關 10 設為 OFF，小地圖隱藏
 *
 * ============================================================================
 */

(() => {
    "use strict";

    // =========================================================================
    // 讀取插件參數
    // =========================================================================
    const pluginName = document.currentScript.src.match(/([^/]+)\.js$/)[1];
    const params = PluginManager.parameters(pluginName);

    const MINIMAP_W     = Number(params["mapWidth"]      || 200);
    const MINIMAP_H     = Number(params["mapHeight"]     || 150);
    const OPACITY       = Number(params["opacity"]       || 200);
    const PLAYER_COLOR  = String(params["playerColor"]   || "#00FF00");
    const EVENT_COLOR   = String(params["eventColor"]    || "#FF0000");
    const SWITCH_ID     = Number(params["switchId"]      || 0);
    const MARGIN_X      = Number(params["marginX"]       || 10);
    const MARGIN_Y      = Number(params["marginY"]       || 10);
    const BORDER_COLOR  = String(params["borderColor"]   || "#FFFFFF");
    const BORDER_WIDTH  = Number(params["borderWidth"]   || 1);
    const WALK_COLOR    = String(params["walkableColor"] || "#888888");

    // =========================================================================
    // 白名單管理模組
    // 結構：{ mapId: Set<eventId> }
    // 以地圖 ID 為 key，儲存各地圖被標記的事件 ID 集合
    // =========================================================================
    const MinimapMarker = {
        _data: {},  // { [mapId]: Set }

        // 取得指定地圖的白名單 Set（不存在則自動建立）
        _getSet(mapId) {
            if (!this._data[mapId]) {
                this._data[mapId] = new Set();
            }
            return this._data[mapId];
        },

        // 將事件 ID 加入當前地圖的白名單
        mark(eventId) {
            this._getSet($gameMap.mapId()).add(eventId);
        },

        // 將事件 ID 從當前地圖的白名單移除
        unmark(eventId) {
            this._getSet($gameMap.mapId()).delete(eventId);
        },

        // 清除當前地圖的所有標記
        clearAll() {
            this._data[$gameMap.mapId()] = new Set();
        },

        // 判斷指定事件 ID 是否在當前地圖的白名單中
        isMarked(eventId) {
            const mapId = $gameMap.mapId();
            if (!this._data[mapId]) return false;
            return this._data[mapId].has(eventId);
        }
    };

    // =========================================================================
    // 註冊插件指令
    // =========================================================================

    // 指令：標記事件到小地圖
    PluginManager.registerCommand(pluginName, "markEvent", (args) => {
        const eventId = Number(args.eventId);
        if (eventId > 0) {
            MinimapMarker.mark(eventId);
        }
    });

    // 指令：取消標記事件
    PluginManager.registerCommand(pluginName, "unmarkEvent", (args) => {
        const eventId = Number(args.eventId);
        if (eventId > 0) {
            MinimapMarker.unmark(eventId);
        }
    });

    // 指令：清除所有標記
    PluginManager.registerCommand(pluginName, "clearAllMarks", () => {
        MinimapMarker.clearAll();
    });

    // =========================================================================
    // Sprite_Minimap：小地圖主體 Sprite
    // =========================================================================
    class Sprite_Minimap extends Sprite {

        constructor() {
            super();
            // 紀錄上一幀的地圖 ID，用於判斷是否需要重新繪製底層
            this._lastMapId = -1;
            this._initSprite();
        }

        // -------------------------------------------------------------------------
        // 初始化 Sprite 結構與雙層畫布
        // -------------------------------------------------------------------------
        _initSprite() {
            // 整體透明度
            this.opacity = OPACITY;

            // 計算右上角位置
            this.x = Graphics.width - MINIMAP_W - MARGIN_X;
            this.y = MARGIN_Y;

            // 建立底層（地形層）Bitmap：只在換地圖時重繪一次
            this._bgBitmap = new Bitmap(MINIMAP_W, MINIMAP_H);
            this._bgSprite = new Sprite(this._bgBitmap);
            this.addChild(this._bgSprite);

            // 建立動態層（標記層）Bitmap：每幀清除並重繪玩家與事件
            this._dotBitmap = new Bitmap(MINIMAP_W, MINIMAP_H);
            this._dotSprite = new Sprite(this._dotBitmap);
            this.addChild(this._dotSprite);
        }

        // -------------------------------------------------------------------------
        // 每幀更新
        // -------------------------------------------------------------------------
        update() {
            super.update();

            // 判斷是否應該顯示小地圖
            this._updateVisibility();
            if (!this.visible) return;

            // 若地圖 ID 改變，代表進入新地圖，重新繪製底層地形
            if ($gameMap.mapId() !== this._lastMapId) {
                this._lastMapId = $gameMap.mapId();
                this._drawBackground();
            }

            // 每幀重新繪製動態層（玩家與事件標點）
            this._drawDots();
        }

        // -------------------------------------------------------------------------
        // 依據開關 ID 控制顯示/隱藏
        // -------------------------------------------------------------------------
        _updateVisibility() {
            if (SWITCH_ID === 0) {
                this.visible = true;
            } else {
                this.visible = $gameSwitches.value(SWITCH_ID);
            }
        }

        // -------------------------------------------------------------------------
        // 繪製底層（地形層）：掃描地圖通行度，靜態繪製一次
        // -------------------------------------------------------------------------
        _drawBackground() {
            const bm = this._bgBitmap;
            bm.clear();

            // MZ 中 context 為公開屬性（MV 是 _context）
            const ctx = bm.context;

            // 底色填黑（代表可行走區域的預設底色）
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

            // 取得地圖尺寸（單位：格子數）
            const mapW = $gameMap.width();
            const mapH = $gameMap.height();

            // 計算每個格子在小地圖上的像素大小（可能是小數）
            const tileW = MINIMAP_W / mapW;
            const tileH = MINIMAP_H / mapH;

            // 掃描所有格子，不可行走的格子蓋上灰色（WALK_COLOR 參數）
            ctx.fillStyle = WALK_COLOR;
            for (let y = 0; y < mapH; y++) {
                for (let x = 0; x < mapW; x++) {
                    const passable =
                        $gameMap.isPassable(x, y, 2) ||
                        $gameMap.isPassable(x, y, 4) ||
                        $gameMap.isPassable(x, y, 6) ||
                        $gameMap.isPassable(x, y, 8);

                    if (!passable) {
                        // 不可行走：填上灰色（牆壁/障礙）
                        const px = Math.floor(x * tileW);
                        const py = Math.floor(y * tileH);
                        const pw = Math.max(1, Math.ceil(tileW));
                        const ph = Math.max(1, Math.ceil(tileH));
                        ctx.fillRect(px, py, pw, ph);
                    }
                    // 可行走：保持黑色底色
                }
            }

            // 繪製外框（若外框寬度 > 0）
            if (BORDER_WIDTH > 0) {
                ctx.strokeStyle = BORDER_COLOR;
                ctx.lineWidth   = BORDER_WIDTH;
                const half = BORDER_WIDTH / 2;
                ctx.strokeRect(half, half, MINIMAP_W - BORDER_WIDTH, MINIMAP_H - BORDER_WIDTH);
            }

            // 通知 PixiJS GPU 材質已變更，需要重新上傳（MZ 正確 API）
            bm.baseTexture.update();
        }

        // -------------------------------------------------------------------------
        // 繪製動態層（標記層）：每幀清除後重新繪製玩家與事件圓點
        // -------------------------------------------------------------------------
        _drawDots() {
            const bm  = this._dotBitmap;
            // MZ 中 context 為公開屬性
            const ctx = bm.context;

            // 清除上一幀的所有標點
            ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

            const mapW  = $gameMap.width();
            const mapH  = $gameMap.height();
            const tileW = MINIMAP_W / mapW;
            const tileH = MINIMAP_H / mapH;

            // 計算標點的大小（至少 2 像素）
            const dotW = Math.max(2, tileW * 1.2);
            const dotH = Math.max(2, tileH * 1.2);

            // ----- 繪製事件標點（只繪製在白名單中的事件）-----
            ctx.fillStyle = EVENT_COLOR;
            for (const event of $gameMap.events()) {
                // 【白名單過濾】只有被插件指令手動標記的事件才顯示
                if (!MinimapMarker.isMarked(event.eventId())) continue;
                // 額外保護：事件若無效頁面則略過
                if (!event.page()) continue;

                // 使用 _realX / _realY 取得插值後的平滑位置
                const ex = (event._realX / mapW) * MINIMAP_W;
                const ey = (event._realY / mapH) * MINIMAP_H;
                this._fillDot(ctx, ex, ey, dotW, dotH);
            }

            // ----- 繪製玩家標點（蓋在事件上方）-----
            ctx.fillStyle = PLAYER_COLOR;
            const px = ($gamePlayer._realX / mapW) * MINIMAP_W;
            const py = ($gamePlayer._realY / mapH) * MINIMAP_H;
            // 玩家標點稍大以突顯
            this._fillDot(ctx, px, py, dotW * 1.5, dotH * 1.5);

            // 通知 PixiJS GPU 材質已變更（MZ 正確 API）
            bm.baseTexture.update();
        }

        // -------------------------------------------------------------------------
        // 以圓形方式填充一個標點（置中對齊）
        // -------------------------------------------------------------------------
        _fillDot(ctx, cx, cy, w, h) {
            const r = Math.min(w, h) / 2;
            ctx.beginPath();
            ctx.arc(
                cx + w / 2 - r,
                cy + h / 2 - r,
                r,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    // =========================================================================
    // 掛載到 Scene_Map：Alias 覆寫 createDisplayObjects
    // =========================================================================
    const _Scene_Map_createDisplayObjects =
        Scene_Map.prototype.createDisplayObjects;

    Scene_Map.prototype.createDisplayObjects = function () {
        _Scene_Map_createDisplayObjects.call(this);
        this._minimapSprite = new Sprite_Minimap();
        this.addChild(this._minimapSprite);
    };

    // =========================================================================
    // 地圖換場時重置記憶的地圖 ID（確保底層在新地圖強制重繪）
    // =========================================================================
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        _Scene_Map_start.call(this);
        if (this._minimapSprite) {
            this._minimapSprite._lastMapId = -1;
        }
    };

})();
