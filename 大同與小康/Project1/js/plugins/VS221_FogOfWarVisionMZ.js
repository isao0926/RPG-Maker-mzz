/*:
 * @target MZ
 * @plugindesc v1.0 自訂迷霧系統：地圖迷霧、濃度、玩家視野、NPC視野、插件指令控制
 * @author ChatGPT
 *
 * @help
 * ============================================================
 * AP_FogSystem.js
 * ============================================================
 * 這是一個 RPG Maker MZ 用的迷霧插件。
 *
 * 功能：
 * 1. 可用地圖備註開關迷霧
 * 2. 可調整霧的顏色與濃度
 * 3. 玩家周圍可見，遠處被霧遮住
 * 4. NPC / 事件可以擁有自己的濃霧視野
 * 5. 可用插件指令在事件中開啟、關閉、調整霧
 *
 * ------------------------------------------------------------
 * 【地圖備註用法】
 * ------------------------------------------------------------
 * 在地圖備註欄寫：
 *
 * <Fog:ON>
 * <FogOpacity:180>
 * <FogColor:#FFFFFF>
 * <FogVision:4>
 *
 * 說明：
 * <Fog:ON>              這張地圖開啟迷霧
 * <Fog:OFF>             這張地圖關閉迷霧
 * <FogOpacity:180>      霧濃度，0~255，越大越濃
 * <FogColor:#FFFFFF>    霧顏色
 * <FogVision:4>         玩家視野半徑 4 格
 *
 * ------------------------------------------------------------
 * 【NPC / 事件備註用法】
 * ------------------------------------------------------------
 * 在事件備註欄寫：
 *
 * <FogVision:3>
 *
 * 表示這個事件周圍 3 格會把霧驅散。
 * 適合用在火把、守衛、NPC、怪物身上。
 *
 * ------------------------------------------------------------
 * 【插件指令】
 * ------------------------------------------------------------
 * Enable Fog       開啟迷霧
 * Disable Fog      關閉迷霧
 * Set Fog Opacity  設定霧濃度
 * Set Fog Color    設定霧顏色
 * Set Player Vision 設定玩家視野
 * Reset Fog        回復地圖備註設定
 *
 * ------------------------------------------------------------
 * 【建議數值】
 * ------------------------------------------------------------
 * 淡霧：Opacity 80
 * 中霧：Opacity 150
 * 濃霧：Opacity 220
 *
 * 玩家視野：3~5 比較自然
 * NPC視野：2~4 比較自然
 *
 * ------------------------------------------------------------
 * 【注意】
 * ------------------------------------------------------------
 * 這是視覺迷霧，不會真的阻擋玩家移動。
 * 如果你要做「濃霧中怪物看不見玩家」或「視野內才觸發戰鬥」，
 * 可以再擴充第二版。
 *
 * @param DefaultEnabled
 * @text 預設開啟迷霧
 * @type boolean
 * @on 開啟
 * @off 關閉
 * @default false
 *
 * @param DefaultOpacity
 * @text 預設霧濃度
 * @type number
 * @min 0
 * @max 255
 * @default 160
 *
 * @param DefaultColor
 * @text 預設霧顏色
 * @type string
 * @default #FFFFFF
 *
 * @param DefaultPlayerVision
 * @text 預設玩家視野格數
 * @type number
 * @min 0
 * @default 4
 *
 * @param SoftEdge
 * @text 視野柔邊寬度
 * @type number
 * @min 0
 * @default 2
 *
 * @param UpdateInterval
 * @text 更新間隔影格
 * @type number
 * @min 1
 * @default 6
 *
 * @command EnableFog
 * @text 開啟迷霧
 * @desc 開啟目前地圖的迷霧。
 *
 * @command DisableFog
 * @text 關閉迷霧
 * @desc 關閉目前地圖的迷霧。
 *
 * @command SetFogOpacity
 * @text 設定霧濃度
 * @desc 設定迷霧濃度，0~255。
 *
 * @arg opacity
 * @text 霧濃度
 * @type number
 * @min 0
 * @max 255
 * @default 160
 *
 * @command SetFogColor
 * @text 設定霧顏色
 * @desc 設定迷霧顏色，例如 #FFFFFF。
 *
 * @arg color
 * @text 顏色
 * @type string
 * @default #FFFFFF
 *
 * @command SetPlayerVision
 * @text 設定玩家視野
 * @desc 設定玩家周圍幾格可以看清楚。
 *
 * @arg radius
 * @text 視野格數
 * @type number
 * @min 0
 * @default 4
 *
 * @command ResetFog
 * @text 重設迷霧
 * @desc 重新讀取地圖備註設定。
 */

(() => {
    'use strict';

    const pluginName = 'AP_FogSystem';
    const params = PluginManager.parameters(pluginName);

    const DEFAULT_ENABLED = String(params.DefaultEnabled || 'false') === 'true';
    const DEFAULT_OPACITY = Number(params.DefaultOpacity || 160);
    const DEFAULT_COLOR = String(params.DefaultColor || '#FFFFFF');
    const DEFAULT_PLAYER_VISION = Number(params.DefaultPlayerVision || 4);
    const SOFT_EDGE = Number(params.SoftEdge || 2);
    const UPDATE_INTERVAL = Math.max(1, Number(params.UpdateInterval || 6));

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function readTag(note, tagName) {
        const regex = new RegExp(`<${tagName}:([^>]+)>`, 'i');
        const match = String(note || '').match(regex);
        return match ? String(match[1]).trim() : null;
    }

    function hasTag(note, text) {
        return String(note || '').toUpperCase().includes(text.toUpperCase());
    }

    // ------------------------------------------------------------
    // Game_System：儲存目前迷霧狀態
    // ------------------------------------------------------------

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initApFogSystem();
    };

    Game_System.prototype.initApFogSystem = function() {
        this._apFogEnabled = DEFAULT_ENABLED;
        this._apFogOpacity = DEFAULT_OPACITY;
        this._apFogColor = DEFAULT_COLOR;
        this._apFogPlayerVision = DEFAULT_PLAYER_VISION;
        this._apFogNeedRefresh = true;
    };

    Game_System.prototype.apFogEnabled = function() {
        if (this._apFogEnabled === undefined) this.initApFogSystem();
        return this._apFogEnabled;
    };

    Game_System.prototype.apFogOpacity = function() {
        if (this._apFogOpacity === undefined) this.initApFogSystem();
        return this._apFogOpacity;
    };

    Game_System.prototype.apFogColor = function() {
        if (this._apFogColor === undefined) this.initApFogSystem();
        return this._apFogColor;
    };

    Game_System.prototype.apFogPlayerVision = function() {
        if (this._apFogPlayerVision === undefined) this.initApFogSystem();
        return this._apFogPlayerVision;
    };

    Game_System.prototype.setApFogEnabled = function(value) {
        this._apFogEnabled = !!value;
        this.requestApFogRefresh();
    };

    Game_System.prototype.setApFogOpacity = function(value) {
        this._apFogOpacity = clamp(Number(value || 0), 0, 255);
        this.requestApFogRefresh();
    };

    Game_System.prototype.setApFogColor = function(value) {
        this._apFogColor = String(value || DEFAULT_COLOR);
        this.requestApFogRefresh();
    };

    Game_System.prototype.setApFogPlayerVision = function(value) {
        this._apFogPlayerVision = Math.max(0, Number(value || 0));
        this.requestApFogRefresh();
    };

    Game_System.prototype.requestApFogRefresh = function() {
        this._apFogNeedRefresh = true;
    };

    Game_System.prototype.apFogNeedRefresh = function() {
        return !!this._apFogNeedRefresh;
    };

    Game_System.prototype.clearApFogRefresh = function() {
        this._apFogNeedRefresh = false;
    };

    // ------------------------------------------------------------
    // 地圖備註讀取
    // ------------------------------------------------------------

    Game_Map.prototype.setupApFogFromMapNote = function() {
        if (!$dataMap) return;

        const note = $dataMap.note || '';

        let enabled = DEFAULT_ENABLED;
        let opacity = DEFAULT_OPACITY;
        let color = DEFAULT_COLOR;
        let playerVision = DEFAULT_PLAYER_VISION;

        if (hasTag(note, '<Fog:ON>')) enabled = true;
        if (hasTag(note, '<Fog:OFF>')) enabled = false;

        const noteOpacity = readTag(note, 'FogOpacity');
        if (noteOpacity !== null) opacity = clamp(Number(noteOpacity), 0, 255);

        const noteColor = readTag(note, 'FogColor');
        if (noteColor !== null) color = noteColor;

        const noteVision = readTag(note, 'FogVision');
        if (noteVision !== null) playerVision = Math.max(0, Number(noteVision));

        $gameSystem.setApFogEnabled(enabled);
        $gameSystem.setApFogOpacity(opacity);
        $gameSystem.setApFogColor(color);
        $gameSystem.setApFogPlayerVision(playerVision);
        $gameSystem.requestApFogRefresh();
    };

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        this.setupApFogFromMapNote();
    };

    // ------------------------------------------------------------
    // 讀取事件備註的 FogVision
    // ------------------------------------------------------------

    Game_Event.prototype.apFogVisionRadius = function() {
        const event = this.event();
        if (!event) return 0;

        let radius = 0;
        const note = event.note || '';
        const noteVision = readTag(note, 'FogVision');
        if (noteVision !== null) radius = Math.max(radius, Number(noteVision));

        const page = this.page();
        if (page && page.list) {
            for (const cmd of page.list) {
                if (cmd.code === 108 || cmd.code === 408) {
                    const comment = cmd.parameters[0];
                    const commentVision = readTag(comment, 'FogVision');
                    if (commentVision !== null) {
                        radius = Math.max(radius, Number(commentVision));
                    }
                }
            }
        }

        return Math.max(0, radius);
    };

    // ------------------------------------------------------------
    // 插件指令
    // ------------------------------------------------------------

    PluginManager.registerCommand(pluginName, 'EnableFog', () => {
        $gameSystem.setApFogEnabled(true);
    });

    PluginManager.registerCommand(pluginName, 'DisableFog', () => {
        $gameSystem.setApFogEnabled(false);
    });

    PluginManager.registerCommand(pluginName, 'SetFogOpacity', args => {
        $gameSystem.setApFogOpacity(Number(args.opacity || 0));
    });

    PluginManager.registerCommand(pluginName, 'SetFogColor', args => {
        $gameSystem.setApFogColor(String(args.color || DEFAULT_COLOR));
    });

    PluginManager.registerCommand(pluginName, 'SetPlayerVision', args => {
        $gameSystem.setApFogPlayerVision(Number(args.radius || 0));
    });

    PluginManager.registerCommand(pluginName, 'ResetFog', () => {
        $gameMap.setupApFogFromMapNote();
    });

    // ------------------------------------------------------------
    // 迷霧 Sprite
    // ------------------------------------------------------------

    function Sprite_ApFog() {
        this.initialize(...arguments);
    }

    Sprite_ApFog.prototype = Object.create(Sprite.prototype);
    Sprite_ApFog.prototype.constructor = Sprite_ApFog;

    Sprite_ApFog.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this.z = 9;
        this._frameCount = 0;
        this._lastDisplayX = null;
        this._lastDisplayY = null;
        this._lastPlayerX = null;
        this._lastPlayerY = null;
        this._lastOpacity = null;
        this._lastColor = null;
        this._lastVision = null;
        this.refresh();
    };

    Sprite_ApFog.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._frameCount++;

        if (this._frameCount % UPDATE_INTERVAL !== 0 && !$gameSystem.apFogNeedRefresh()) {
            return;
        }

        if (this.needsRefresh()) {
            this.refresh();
        }
    };

    Sprite_ApFog.prototype.needsRefresh = function() {
        if ($gameSystem.apFogNeedRefresh()) return true;
        if (this._lastDisplayX !== $gameMap.displayX()) return true;
        if (this._lastDisplayY !== $gameMap.displayY()) return true;
        if (this._lastPlayerX !== $gamePlayer.x) return true;
        if (this._lastPlayerY !== $gamePlayer.y) return true;
        if (this._lastOpacity !== $gameSystem.apFogOpacity()) return true;
        if (this._lastColor !== $gameSystem.apFogColor()) return true;
        if (this._lastVision !== $gameSystem.apFogPlayerVision()) return true;
        return false;
    };

    Sprite_ApFog.prototype.refresh = function() {
        this._lastDisplayX = $gameMap.displayX();
        this._lastDisplayY = $gameMap.displayY();
        this._lastPlayerX = $gamePlayer.x;
        this._lastPlayerY = $gamePlayer.y;
        this._lastOpacity = $gameSystem.apFogOpacity();
        this._lastColor = $gameSystem.apFogColor();
        this._lastVision = $gameSystem.apFogPlayerVision();
        $gameSystem.clearApFogRefresh();

        this.visible = $gameSystem.apFogEnabled();
        if (!this.visible) {
            this.bitmap.clear();
            return;
        }

        const bitmap = this.bitmap;
        bitmap.clear();

        const color = $gameSystem.apFogColor();
        const opacity = clamp($gameSystem.apFogOpacity(), 0, 255);
        const alpha = opacity / 255;

        bitmap.context.save();
        bitmap.context.globalAlpha = alpha;
        bitmap.context.fillStyle = color;
        bitmap.context.fillRect(0, 0, Graphics.width, Graphics.height);
        bitmap.context.restore();

        this.clearVisionAtCharacter($gamePlayer, $gameSystem.apFogPlayerVision());

        for (const event of $gameMap.events()) {
            if (!event || event._erased) continue;
            const radius = event.apFogVisionRadius ? event.apFogVisionRadius() : 0;
            if (radius > 0) {
                this.clearVisionAtCharacter(event, radius);
            }
        }

        bitmap.baseTexture.update();
    };

    Sprite_ApFog.prototype.characterScreenX = function(character) {
        return Math.round(character.screenX());
    };

    Sprite_ApFog.prototype.characterScreenY = function(character) {
        return Math.round(character.screenY() - $gameMap.tileHeight() / 2);
    };

    Sprite_ApFog.prototype.clearVisionAtCharacter = function(character, radiusInTiles) {
        if (radiusInTiles <= 0) return;

        const bitmap = this.bitmap;
        const ctx = bitmap.context;
        const tileSize = Math.max($gameMap.tileWidth(), $gameMap.tileHeight());
        const innerRadius = radiusInTiles * tileSize;
        const outerRadius = (radiusInTiles + SOFT_EDGE) * tileSize;
        const x = this.characterScreenX(character);
        const y = this.characterScreenY(character);

        const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    // ------------------------------------------------------------
    // 加到地圖畫面上
    // ------------------------------------------------------------

    const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
    Spriteset_Map.prototype.createUpperLayer = function() {
        _Spriteset_Map_createUpperLayer.call(this);
        this.createApFogLayer();
    };

    Spriteset_Map.prototype.createApFogLayer = function() {
        this._apFogSprite = new Sprite_ApFog();
        this.addChild(this._apFogSprite);
    };

})();
