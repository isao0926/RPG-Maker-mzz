/*:
 * @target MZ
 * @plugindesc 畫面周圍環繞濃霧，會慢慢飄動，可搭配 AP_FogSystem 使用
 * @author ChatGPT
 *
 * @help
 * 地圖備註：
 * <MistOverlay:ON>
 *
 * 關閉：
 * <MistOverlay:OFF>
 *
 * 建議搭配：
 * <Fog:ON>
 * <FogOpacity:220>
 * <FogColor:#000000>
 * <FogVision:4>
 * <MistOverlay:ON>
 *
 * @param DefaultEnabled
 * @text 預設開啟
 * @type boolean
 * @default false
 *
 * @param MistColor
 * @text 濃霧顏色
 * @type string
 * @default #AFC7E8
 *
 * @param MistOpacity
 * @text 濃霧透明度
 * @type number
 * @min 0
 * @max 255
 * @default 170
 *
 * @param EdgeDarkness
 * @text 邊緣黑暗強度
 * @type number
 * @min 0
 * @max 255
 * @default 190
 *
 * @param MistPower
 * @text 濃霧強度
 * @type number
 * @min 1
 * @max 10
 * @default 7
 *
 * @param MistSpeedX
 * @text 水平飄動速度
 * @type number
 * @decimals 2
 * @default 0.25
 *
 * @param MistSpeedY
 * @text 垂直飄動速度
 * @type number
 * @decimals 2
 * @default 0.08
 *
 * @param CenterClearRadius
 * @text 中央清晰範圍
 * @type number
 * @min 0
 * @default 280
 */

(() => {
    'use strict';

    const pluginName = 'AP_FogMistOverlay';
    const params = PluginManager.parameters(pluginName);

    const DEFAULT_ENABLED = String(params.DefaultEnabled || 'false') === 'true';
    const MIST_COLOR = String(params.MistColor || '#AFC7E8');
    const MIST_OPACITY = Number(params.MistOpacity || 170);
    const EDGE_DARKNESS = Number(params.EdgeDarkness || 190);
    const MIST_POWER = Number(params.MistPower || 7);
    const SPEED_X = Number(params.MistSpeedX || 0.25);
    const SPEED_Y = Number(params.MistSpeedY || 0.08);
    const CENTER_CLEAR_RADIUS = Number(params.CenterClearRadius || 280);

    function hasTag(note, tag) {
        return String(note || '').toUpperCase().includes(tag.toUpperCase());
    }

    function hexToRgb(hex) {
        let text = String(hex || '#FFFFFF').replace('#', '');
        if (text.length === 3) {
            text = text[0]+text[0]+text[1]+text[1]+text[2]+text[2];
        }
        const num = parseInt(text, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._apMistOverlayEnabled = DEFAULT_ENABLED;
    };

    Game_System.prototype.apMistOverlayEnabled = function() {
        if (this._apMistOverlayEnabled === undefined) {
            this._apMistOverlayEnabled = DEFAULT_ENABLED;
        }
        return this._apMistOverlayEnabled;
    };

    Game_System.prototype.setApMistOverlayEnabled = function(value) {
        this._apMistOverlayEnabled = !!value;
    };

    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);

        const note = $dataMap ? $dataMap.note : '';

        if (hasTag(note, '<MistOverlay:ON>')) {
            $gameSystem.setApMistOverlayEnabled(true);
        } else if (hasTag(note, '<MistOverlay:OFF>')) {
            $gameSystem.setApMistOverlayEnabled(false);
        } else {
            $gameSystem.setApMistOverlayEnabled(DEFAULT_ENABLED);
        }
    };

    function Sprite_ApFogMistOverlay() {
        this.initialize(...arguments);
    }

    Sprite_ApFogMistOverlay.prototype = Object.create(Sprite.prototype);
    Sprite_ApFogMistOverlay.prototype.constructor = Sprite_ApFogMistOverlay;

    Sprite_ApFogMistOverlay.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.bitmap = new Bitmap(Graphics.width, Graphics.height);
        this._time = 0;
        this._mistBlobs = [];
        this.createMistBlobs();
    };

    Sprite_ApFogMistOverlay.prototype.createMistBlobs = function() {
        const w = Graphics.width;
        const h = Graphics.height;
        const count = 34;

        this._mistBlobs = [];

        for (let i = 0; i < count; i++) {
            const side = i % 4;
            let x;
            let y;

            if (side === 0) {
                x = Math.random() * w;
                y = Math.random() * h * 0.22;
            } else if (side === 1) {
                x = Math.random() * w;
                y = h - Math.random() * h * 0.22;
            } else if (side === 2) {
                x = Math.random() * w * 0.22;
                y = Math.random() * h;
            } else {
                x = w - Math.random() * w * 0.22;
                y = Math.random() * h;
            }

            this._mistBlobs.push({
                x: x,
                y: y,
                size: 140 + Math.random() * 260,
                alpha: 0.22 + Math.random() * 0.32,
                phase: Math.random() * Math.PI * 2,
                dx: -0.6 + Math.random() * 1.2,
                dy: -0.4 + Math.random() * 0.8
            });
        }
    };

    Sprite_ApFogMistOverlay.prototype.update = function() {
        Sprite.prototype.update.call(this);

        this.visible = $gameSystem.apMistOverlayEnabled();

        if (!this.visible) {
            this.bitmap.clear();
            return;
        }

        this._time += 0.01;
        this.refreshMist();
    };

    Sprite_ApFogMistOverlay.prototype.refreshMist = function() {
        const bitmap = this.bitmap;
        const ctx = bitmap.context;
        const w = Graphics.width;
        const h = Graphics.height;

        bitmap.clear();

        this.drawEdgeDarkness(ctx, w, h);

        for (const blob of this._mistBlobs) {
            const moveX = Math.sin(this._time + blob.phase) * 45 + this._time * SPEED_X * 80 * blob.dx;
            const moveY = Math.cos(this._time + blob.phase) * 30 + this._time * SPEED_Y * 80 * blob.dy;
            const pulse = 1 + Math.sin(this._time * 2 + blob.phase) * 0.08;

            this.drawMistBlob(
                ctx,
                blob.x + moveX,
                blob.y + moveY,
                blob.size * pulse,
                blob.alpha
            );
        }

        this.clearCenter(ctx, w, h);

        bitmap.baseTexture.update();
    };

    Sprite_ApFogMistOverlay.prototype.drawEdgeDarkness = function(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.max(w, h) * 0.75;
        const alpha = EDGE_DARKNESS / 255;

        const gradient = ctx.createRadialGradient(cx, cy, CENTER_CLEAR_RADIUS, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.35})`);
        gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    };

    Sprite_ApFogMistOverlay.prototype.drawMistBlob = function(ctx, x, y, size, alpha) {
        const rgb = hexToRgb(MIST_COLOR);
        const power = MIST_POWER / 10;
        const baseAlpha = MIST_OPACITY / 255;
        const a = alpha * power * baseAlpha;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`);
        gradient.addColorStop(0.45, `rgba(${rgb.r},${rgb.g},${rgb.b},${a * 0.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    Sprite_ApFogMistOverlay.prototype.clearCenter = function(ctx, w, h) {
        const cx = w / 2;
        const cy = h / 2;
        const radius = CENTER_CLEAR_RADIUS;

        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0.35)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
    Spriteset_Map.prototype.createUpperLayer = function() {
        _Spriteset_Map_createUpperLayer.call(this);
        this._apFogMistOverlay = new Sprite_ApFogMistOverlay();
        this.addChild(this._apFogMistOverlay);
    };

})();