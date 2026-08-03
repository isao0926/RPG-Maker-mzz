//=============================================================================
// EventProximitySoundV2.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 讓地圖事件成為循環音源，玩家越靠近音量越大，越遠離音量越小，並支援自動左右聲道定位。 v2.0.0
 * @author Claude
 * @url
 *
 * @param ---基本設定---
 * @default
 *
 * @param updateInterval
 * @text 更新間隔
 * @desc 每隔幾幀重新計算一次事件與玩家的距離、音量與聲道（數值越小越即時，但越耗效能）。
 * @type number
 * @min 1
 * @max 60
 * @default 10
 * @parent ---基本設定---
 *
 * @param defaultRange
 * @text 預設可聽範圍
 * @desc 事件註解沒有個別指定範圍時使用的預設可聽範圍（單位：格）。
 * @type number
 * @min 1
 * @max 999
 * @default 10
 * @parent ---基本設定---
 *
 * @param defaultMaxVolume
 * @text 預設最大音量
 * @desc 玩家靠近事件（距離為 0）時的最大音量。範圍 0～100。
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * @parent ---基本設定---
 *
 * @param defaultMinVolume
 * @text 預設最小音量
 * @desc 玩家剛好在可聽範圍邊界時的最低音量。範圍 0～100。
 * @type number
 * @min 0
 * @max 100
 * @default 0
 * @parent ---基本設定---
 *
 * @param defaultPitch
 * @text 預設音高
 * @desc 事件音效的預設音高，100 為原始音高。
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @parent ---基本設定---
 *
 * @param defaultSmoothing
 * @text 預設平滑速度
 * @desc 控制音量與左右聲道變化的平滑速度，數值越大變化越快（越接近瞬間切換），數值越小越平滑。建議 0.01～0.3。
 * @type number
 * @decimals 2
 * @min 0.01
 * @max 1.00
 * @default 0.08
 * @parent ---基本設定---
 *
 * @param distanceMode
 * @text 距離計算方式
 * @desc 選擇要以「圓形距離（實際直線距離）」或「方格步數（座標格數）」來計算玩家與事件的距離。
 * @type select
 * @option 圓形距離
 * @value circle
 * @option 方格步數
 * @value grid
 * @default circle
 * @parent ---基本設定---
 *
 * @param volumeCurve
 * @text 音量曲線
 * @desc 選擇音量隨距離變化的曲線類型。
 * @type select
 * @option 線性
 * @value linear
 * @option 平滑曲線
 * @value smooth
 * @option 指數曲線
 * @value exponential
 * @default smooth
 * @parent ---基本設定---
 *
 * @param ---左右聲道設定---
 * @default
 *
 * @param enablePanning
 * @text 啟用左右聲道
 * @desc 是否啟用自動左右聲道定位（事件在玩家右邊聲音偏右，在左邊聲音偏左）。
 * @type boolean
 * @on 啟用
 * @off 關閉
 * @default true
 * @parent ---左右聲道設定---
 *
 * @param maxPanOffset
 * @text 最大左右偏移
 * @desc 聲音最多可以偏向左邊或右邊多少（數值範圍建議 0～100）。
 * @type number
 * @min 0
 * @max 100
 * @default 100
 * @parent ---左右聲道設定---
 *
 * @command reloadCurrentMap
 * @text 重新讀取目前地圖
 * @desc 重新掃描目前地圖上所有事件的距離音效設定。
 *
 * @command stopAllProximitySounds
 * @text 停止全部距離音效
 * @desc 立即停止目前地圖上全部距離音效。
 *
 * @command enableProximitySoundSystem
 * @text 啟用距離音效系統
 * @desc 重新啟用整套距離音效系統（若先前被停用）。
 *
 * @command disableProximitySoundSystem
 * @text 停用距離音效系統
 * @desc 停止全部聲音並暫停整套距離音效系統。
 *
 * @command startEventSound
 * @text 啟動指定事件音效
 * @desc 手動啟動指定事件的距離音效（若該事件本身有正確的距離音效註解）。
 *
 * @arg eventId
 * @text 事件編號
 * @desc 要啟動音效的事件編號。
 * @type number
 * @min 0
 * @default 0
 *
 * @command stopEventSound
 * @text 停止指定事件音效
 * @desc 手動停止指定事件的距離音效。
 *
 * @arg eventId
 * @text 事件編號
 * @desc 要停止音效的事件編號。
 * @type number
 * @min 0
 * @default 0
 *
 * @command changeEventRange
 * @text 修改事件範圍
 * @desc 動態修改指定事件的可聽範圍。
 *
 * @arg eventId
 * @text 事件編號
 * @desc 要修改的事件編號。
 * @type number
 * @min 0
 * @default 0
 *
 * @arg newRange
 * @text 新範圍
 * @desc 新的可聽範圍（單位：格）。
 * @type number
 * @min 1
 * @default 10
 *
 * @command changeEventMaxVolume
 * @text 修改事件最大音量
 * @desc 動態修改指定事件的最大音量。
 *
 * @arg eventId
 * @text 事件編號
 * @desc 要修改的事件編號。
 * @type number
 * @min 0
 * @default 0
 *
 * @arg newMaxVolume
 * @text 新最大音量
 * @desc 新的最大音量（0～100）。
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @command setEventMute
 * @text 設定事件靜音
 * @desc 將指定事件的距離音效設為靜音或取消靜音。
 *
 * @arg eventId
 * @text 事件編號
 * @desc 要設定的事件編號。
 * @type number
 * @min 0
 * @default 0
 *
 * @arg mute
 * @text 是否靜音
 * @desc 是否將此事件的音效設為靜音。
 * @type boolean
 * @on 靜音
 * @off 取消靜音
 * @default false
 *
 * @command setEventPan
 * @text 設定事件左右聲道
 * @desc 設定指定事件是否使用自動左右聲道定位。
 *
 * @arg eventId
 * @text 事件編號
 * @desc 要設定的事件編號。
 * @type number
 * @min 0
 * @default 0
 *
 * @arg panMode
 * @text 左右聲道模式
 * @desc 選擇自動定位或關閉左右聲道。
 * @type select
 * @option 自動
 * @value auto
 * @option 關閉
 * @value off
 * @default auto
 *
 * @help
 * ============================================================================
 * EventProximitySoundV2.js － 事件距離音效系統
 * ============================================================================
 *
 * 【插件功能】
 * 讓地圖上的事件成為「循環環境音源」。玩家距離事件越近，音量越大；
 * 距離越遠，音量越小；離開可聽範圍後音量會平滑降為 0。
 * 同時支援自動左右聲道定位，讓聲音隨事件在玩家左右的相對位置而偏移。
 *
 * ----------------------------------------------------------------------------
 * 一、安裝方法
 * ----------------------------------------------------------------------------
 * 1. 將本檔案 EventProximitySoundV2.js 放入專案的 js/plugins 資料夾。
 * 2. 在「插件管理器」中開啟本插件，並依需求調整插件參數。
 * 3. 不需要安裝其他插件即可運作。
 *
 * ----------------------------------------------------------------------------
 * 二、音檔放置位置
 * ----------------------------------------------------------------------------
 * 音效檔案請放置於：
 *     audio/bgs/
 * 註解中填寫的檔名「不要」包含副檔名（例如 WolfHowl，而不是 WolfHowl.ogg）。
 *
 * ----------------------------------------------------------------------------
 * 三、基本註解格式（簡易格式）
 * ----------------------------------------------------------------------------
 * 在事件頁的「註解」中輸入：
 *
 *     <距離音效: 檔名, 可聽範圍, 最大音量>
 *
 * 範例（狼王，音效檔為 WolfHowl.ogg，可聽範圍 12 格，最大音量 100）：
 *
 *     <距離音效: WolfHowl, 12, 100>
 *
 * ----------------------------------------------------------------------------
 * 四、完整註解格式
 * ----------------------------------------------------------------------------
 * 若需要更精細的設定，可使用多行完整格式：
 *
 *     <距離音效:
 *     檔案=WolfHowl
 *     範圍=12
 *     最大音量=100
 *     最小音量=0
 *     音高=100
 *     平滑速度=0.08
 *     左右聲道=自動
 *     >
 *
 * 可用欄位說明：
 *   檔案     ：音效檔名（不含副檔名），對應 audio/bgs/ 資料夾。
 *   範圍     ：可聽範圍，單位為格。
 *   最大音量 ：玩家貼近事件時的音量（0～100）。
 *   最小音量 ：玩家剛進入可聽範圍邊界時的音量（0～100）。
 *   音高     ：音效播放音高，100 為原始音高。
 *   平滑速度 ：音量與聲道變化的平滑速度（建議 0.01～0.3）。
 *   左右聲道 ：填寫「自動」或「關閉」，控制此事件是否使用左右聲道定位。
 *
 * 若省略某個欄位，會自動使用插件參數中的預設值。
 *
 * 註：本插件亦相容英文標籤（例如 <ProximitySound: file=WolfHowl, range=12>），
 * 但建議一律使用中文格式，說明文件也以中文格式為主。
 *
 * ----------------------------------------------------------------------------
 * 五、插件參數說明
 * ----------------------------------------------------------------------------
 *   更新間隔       ：每隔幾幀重新計算一次距離與音量。
 *   預設可聽範圍   ：事件未個別指定範圍時使用的預設值。
 *   預設最大音量   ：玩家靠近事件時的最大音量。
 *   預設最小音量   ：玩家剛進入可聽範圍時的最低音量。
 *   預設音高       ：預設音高，100 為原始音高。
 *   預設平滑速度   ：控制音量與左右聲道變化的速度。
 *   距離計算方式   ：圓形距離（直線距離）或方格步數。
 *   音量曲線       ：線性、平滑曲線或指數曲線。
 *   啟用左右聲道   ：是否啟用自動左右聲道定位。
 *   最大左右偏移   ：聲音最多可偏向左右多少。
 *
 * ----------------------------------------------------------------------------
 * 六、插件指令說明
 * ----------------------------------------------------------------------------
 *   重新讀取目前地圖   ：重新掃描目前地圖所有事件的距離音效設定。
 *   停止全部距離音效   ：立即停止目前地圖全部距離音效。
 *   啟用距離音效系統   ：重新啟用整套系統。
 *   停用距離音效系統   ：停止全部聲音並暫停系統。
 *   啟動指定事件音效   ：手動啟動指定事件的音效（參數：事件編號）。
 *   停止指定事件音效   ：手動停止指定事件的音效（參數：事件編號）。
 *   修改事件範圍       ：動態修改事件範圍（參數：事件編號、新範圍）。
 *   修改事件最大音量   ：動態修改事件最大音量（參數：事件編號、新最大音量）。
 *   設定事件靜音       ：將事件設為靜音或取消靜音（參數：事件編號、是否靜音）。
 *   設定事件左右聲道   ：設定事件左右聲道模式（參數：事件編號、自動或關閉）。
 *
 * ----------------------------------------------------------------------------
 * 七、實際範例
 * ----------------------------------------------------------------------------
 * 狼王：
 *     <距離音效: WolfHowl, 12, 100>
 *
 * 瀑布：
 *     <距離音效:
 *     檔案=Waterfall
 *     範圍=18
 *     最大音量=80
 *     最小音量=0
 *     音高=100
 *     平滑速度=0.08
 *     左右聲道=自動
 *     >
 *
 * 營火：
 *     <距離音效:
 *     檔案=Fire
 *     範圍=5
 *     最大音量=45
 *     音高=95
 *     左右聲道=關閉
 *     >
 *
 * 一張地圖上可以同時存在瀑布、營火、狼王、風聲、機械聲、河流聲等多個事件，
 * 每個事件的音量、範圍、音高、左右聲道、平滑速度都是完全獨立計算，
 * 不會互相覆蓋，也不會中斷地圖原本的 BGM。
 *
 * ----------------------------------------------------------------------------
 * 八、事件切換頁面的注意事項
 * ----------------------------------------------------------------------------
 * 當事件的出現條件改變、切換到不同事件頁時，插件會自動重新讀取該事件頁
 * 的註解設定。若新的事件頁沒有「距離音效」註解，該事件的聲音會自動停止。
 * 因此若想讓某個事件頁「靜音」，只要該頁的註解中不要寫距離音效標籤即可。
 *
 * ----------------------------------------------------------------------------
 * 九、常見錯誤排查 ／ 音檔不播放時的檢查方式
 * ----------------------------------------------------------------------------
 * 1. 確認音檔確實放在 audio/bgs/ 資料夾，且副檔名為專案支援的格式
 *    （通常是 .ogg 或 .m4a）。
 * 2. 確認註解中的檔名「不要」包含副檔名，且拼字與大小寫與實際檔名相符。
 * 3. 確認事件註解的格式正確，特別是全形／半形冒號、逗號是否誤植。
 * 4. 若使用完整格式，確認最後有單獨一行的「>」作為結尾。
 * 5. 確認玩家目前位置與事件的距離小於「可聽範圍」。
 * 6. 若音量一直是 0，檢查「預設最大音量」與事件註解中的「最大音量」
 *    是否被設定為 0，或系統是否被「停用距離音效系統」指令關閉。
 * 7. 若瀏覽器主控台出現找不到音效檔的警告，代表檔案路徑或檔名有誤，
 *    請對照主控台顯示的實際路徑檢查專案的 audio/bgs/ 資料夾。
 *
 * ============================================================================
 * 版本：2.0.0
 * ============================================================================
 */

(() => {
    "use strict";

    //=========================================================================
    // 插件基本資訊與參數讀取
    //=========================================================================
    const PLUGIN_NAME = "EventProximitySoundV2";
    const rawParams = PluginManager.parameters(PLUGIN_NAME);

    function toNumber(value, fallback) {
        const n = Number(value);
        return isNaN(n) ? fallback : n;
    }

    function toBoolean(value, fallback) {
        if (value === "true") return true;
        if (value === "false") return false;
        return fallback;
    }

    const Params = {
        updateInterval: Math.max(1, toNumber(rawParams["updateInterval"], 10)),
        defaultRange: Math.max(1, toNumber(rawParams["defaultRange"], 10)),
        defaultMaxVolume: toNumber(rawParams["defaultMaxVolume"], 90),
        defaultMinVolume: toNumber(rawParams["defaultMinVolume"], 0),
        defaultPitch: toNumber(rawParams["defaultPitch"], 100),
        defaultSmoothing: toNumber(rawParams["defaultSmoothing"], 0.08),
        distanceMode: rawParams["distanceMode"] || "circle",
        volumeCurve: rawParams["volumeCurve"] || "smooth",
        enablePanning: toBoolean(rawParams["enablePanning"], true),
        maxPanOffset: toNumber(rawParams["maxPanOffset"], 100)
    };

    // 系統是否啟用（可由插件指令「停用距離音效系統」關閉）
    let systemEnabled = true;

    //=========================================================================
    // 註解解析工具
    //=========================================================================

    // 中文／英文欄位名稱對照表
    const FIELD_ALIASES = {
        file: ["檔案", "file"],
        range: ["範圍", "range"],
        maxVolume: ["最大音量", "maxvolume", "maxVolume"],
        minVolume: ["最小音量", "minvolume", "minVolume"],
        pitch: ["音高", "pitch"],
        smoothing: ["平滑速度", "smoothing", "smooth"],
        pan: ["左右聲道", "pan", "panning"]
    };

    function matchFieldKey(rawKey) {
        const key = rawKey.trim().toLowerCase();
        for (const fieldName in FIELD_ALIASES) {
            const aliases = FIELD_ALIASES[fieldName];
            for (const alias of aliases) {
                if (alias.toLowerCase() === key) {
                    return fieldName;
                }
            }
        }
        return null;
    }

    function normalizePanValue(value) {
        const v = String(value).trim();
        if (v === "自動" || v.toLowerCase() === "auto" || v === "") {
            return "auto";
        }
        if (v === "關閉" || v.toLowerCase() === "off") {
            return "off";
        }
        return "auto";
    }

    // 取得事件目前頁面中所有註解（108／408）合併後的文字
    function getEventNoteText(gameEvent) {
        if (!gameEvent) return "";
        const page = gameEvent.page ? gameEvent.page() : null;
        if (!page || !page.list) return "";
        let text = "";
        for (const command of page.list) {
            if (command.code === 108 || command.code === 408) {
                text += command.parameters[0] + "\n";
            }
        }
        return text;
    }

    // 從合併後的註解文字中解析距離音效設定
    // 回傳 null 代表此事件頁沒有距離音效設定
    function parseProximityConfig(noteText) {
        if (!noteText) return null;
        const tagRegex = /<(?:距離音效|ProximitySound)\s*:?\s*([\s\S]*?)>/i;
        const match = tagRegex.exec(noteText);
        if (!match) return null;
        const content = match[1].trim();
        if (content.length === 0) return null;

        let raw;
        if (content.indexOf("=") >= 0) {
            raw = parseFullFormat(content);
        } else {
            raw = parseSimpleFormat(content);
        }
        if (!raw || !raw.file) return null;

        // 補上預設值並做數值安全檢查
        const config = {
            file: String(raw.file).trim(),
            range: clampNumber(toNumber(raw.range, Params.defaultRange), 1, 9999),
            maxVolume: clampNumber(toNumber(raw.maxVolume, Params.defaultMaxVolume), 0, 100),
            minVolume: clampNumber(toNumber(raw.minVolume, Params.defaultMinVolume), 0, 100),
            pitch: clampNumber(toNumber(raw.pitch, Params.defaultPitch), 50, 150),
            smoothing: clampNumber(toNumber(raw.smoothing, Params.defaultSmoothing), 0.01, 1),
            panMode: raw.pan ? normalizePanValue(raw.pan) : "auto"
        };
        return config;
    }

    function parseSimpleFormat(content) {
        // <距離音效: 檔名, 範圍, 最大音量>
        const parts = content.split(",").map(s => s.trim()).filter(s => s.length > 0);
        if (parts.length === 0) return null;
        return {
            file: parts[0],
            range: parts.length > 1 ? parts[1] : undefined,
            maxVolume: parts.length > 2 ? parts[2] : undefined
        };
    }

    function parseFullFormat(content) {
        // 多行 key=value 格式
        const lines = content.split(/\r?\n/);
        const result = {};
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0) continue;
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex < 0) continue;
            const rawKey = trimmed.substring(0, eqIndex);
            const rawValue = trimmed.substring(eqIndex + 1).trim();
            const fieldName = matchFieldKey(rawKey);
            if (fieldName) {
                result[fieldName] = rawValue;
            }
        }
        return result;
    }

    function clampNumber(value, min, max) {
        if (isNaN(value)) return min;
        return Math.max(min, Math.min(max, value));
    }

    //=========================================================================
    // 單一事件音源資料
    //=========================================================================
    class ProximitySoundInstance {
        constructor(eventId, config) {
            this.eventId = eventId;
            this.config = config;
            this.buffer = null;
            this.isMuted = false;
            this.currentVolume = 0;
            this.currentPan = 0;
            this.targetVolume = 0;
            this.targetPan = 0;
            this.ready = false;
            this.destroyed = false;
            this._createBuffer();
        }

        // 建立音效緩衝區並開始循環播放
        _createBuffer() {
            try {
                const buffer = AudioManager.createBuffer("bgs/", this.config.file);
                this.buffer = buffer;
                this.ready = false;
                buffer.addLoadListener(() => {
                    if (this.destroyed || !this.buffer) return;
                    this.ready = true;
                    try {
                        this.buffer.volume = 0;
                        this.buffer.pitch = this.config.pitch / 100;
                        this.buffer.pan = 0;
                        this.buffer.play(true, 0);
                    } catch (e) {
                        console.warn(
                            "[距離音效系統] 事件 " + this.eventId +
                            " 的音效播放失敗，請確認音檔是否存在於 audio/bgs/。",
                            e
                        );
                    }
                });
            } catch (e) {
                console.warn(
                    "[距離音效系統] 事件 " + this.eventId +
                    " 建立音效緩衝區失敗，請確認檔名「" + this.config.file +
                    "」是否正確，且檔案位於 audio/bgs/ 資料夾中。",
                    e
                );
            }
        }

        // 每幀更新音量與聲道的平滑插值，並將結果套用到實際音效物件
        applySmoothing() {
            if (this.destroyed || !this.buffer || !this.ready) return;
            const smoothing = this.config.smoothing;
            this.currentVolume += (this.targetVolume - this.currentVolume) * smoothing;
            this.currentPan += (this.targetPan - this.currentPan) * smoothing;

            if (Math.abs(this.currentVolume - this.targetVolume) < 0.05) {
                this.currentVolume = this.targetVolume;
            }
            if (Math.abs(this.currentPan - this.targetPan) < 0.05) {
                this.currentPan = this.targetPan;
            }

            const configVolume = ConfigManager.bgsVolume !== undefined ? ConfigManager.bgsVolume : 100;
            const outputVolume = this.isMuted
                ? 0
                : (this.currentVolume / 100) * (configVolume / 100);

            this.buffer.volume = Math.max(0, Math.min(1, outputVolume));
            this.buffer.pan = Math.max(-100, Math.min(100, this.currentPan));
            this.buffer.pitch = Math.max(0.5, Math.min(1.5, this.config.pitch / 100));
        }

        setTarget(volume, pan) {
            this.targetVolume = volume;
            this.targetPan = pan;
        }

        destroy() {
            this.destroyed = true;
            if (this.buffer) {
                try {
                    this.buffer.stop();
                } catch (e) {
                    // 忽略停止時的例外，避免因音效物件狀態異常而中斷流程
                }
            }
            this.buffer = null;
        }
    }

    //=========================================================================
    // 距離音效管理器（單例）
    //=========================================================================
    const ProximitySoundManager = {
        _sounds: new Map(), // eventId -> ProximitySoundInstance
        _frameCounter: 0,

        // 重新掃描目前地圖上所有事件
        scanMap() {
            this.stopAll();
            if (!$gameMap) return;
            const events = $gameMap.events ? $gameMap.events() : [];
            for (const event of events) {
                this._setupEvent(event);
            }
        },

        // 針對單一事件讀取註解並建立（或更新）其音效
        _setupEvent(event) {
            if (!event) return;
            const noteText = getEventNoteText(event);
            const config = parseProximityConfig(noteText);
            const eventId = event.eventId();

            const existing = this._sounds.get(eventId);
            if (existing) {
                existing.destroy();
                this._sounds.delete(eventId);
            }

            if (config) {
                const instance = new ProximitySoundInstance(eventId, config);
                this._sounds.set(eventId, instance);
            }
        },

        // 事件切換頁面時呼叫
        onEventPageChange(event) {
            if (!systemEnabled) return;
            if (!event) return;
            this._setupEvent(event);
        },

        // 事件被消除時呼叫
        onEventErase(event) {
            if (!event) return;
            const eventId = event.eventId();
            const instance = this._sounds.get(eventId);
            if (instance) {
                instance.destroy();
                this._sounds.delete(eventId);
            }
        },

        // 停止並釋放全部音效（切換地圖、場景結束時使用）
        stopAll() {
            this._sounds.forEach(instance => instance.destroy());
            this._sounds.clear();
        },

        enableSystem() {
            systemEnabled = true;
            this.scanMap();
        },

        disableSystem() {
            systemEnabled = false;
            this.stopAll();
        },

        startEventSound(eventId) {
            if (!$gameMap) return;
            const event = $gameMap.event(eventId);
            if (event) {
                this._setupEvent(event);
            }
        },

        stopEventSound(eventId) {
            const instance = this._sounds.get(eventId);
            if (instance) {
                instance.destroy();
                this._sounds.delete(eventId);
            }
        },

        changeEventRange(eventId, newRange) {
            const instance = this._sounds.get(eventId);
            if (instance) {
                instance.config.range = clampNumber(newRange, 1, 9999);
            }
        },

        changeEventMaxVolume(eventId, newMaxVolume) {
            const instance = this._sounds.get(eventId);
            if (instance) {
                instance.config.maxVolume = clampNumber(newMaxVolume, 0, 100);
            }
        },

        setEventMute(eventId, mute) {
            const instance = this._sounds.get(eventId);
            if (instance) {
                instance.isMuted = !!mute;
            }
        },

        setEventPan(eventId, panMode) {
            const instance = this._sounds.get(eventId);
            if (instance) {
                instance.config.panMode = panMode === "off" ? "off" : "auto";
            }
        },

        // 計算音量曲線
        _applyCurve(ratio) {
            const clamped = Math.max(0, Math.min(1, ratio));
            switch (Params.volumeCurve) {
                case "linear":
                    return clamped;
                case "exponential":
                    return clamped * clamped;
                case "smooth":
                default:
                    // smoothstep 曲線
                    return clamped * clamped * (3 - 2 * clamped);
            }
        },

        // 重新計算所有事件的目標音量與聲道（依「更新間隔」執行）
        _recalculateTargets() {
            if (!systemEnabled || !$gameMap || !$gamePlayer) return;
            const player = $gamePlayer;

            this._sounds.forEach((instance, eventId) => {
                const event = $gameMap.event(eventId);
                if (!event) {
                    instance.setTarget(0, instance.targetPan);
                    return;
                }

                const config = instance.config;
                const realDx = $gameMap.deltaX(event._realX, player._realX);
                const realDy = $gameMap.deltaY(event._realY, player._realY);

                let distance;
                if (Params.distanceMode === "grid") {
                    const gx = $gameMap.deltaX(event.x, player.x);
                    const gy = $gameMap.deltaY(event.y, player.y);
                    distance = Math.max(Math.abs(gx), Math.abs(gy));
                } else {
                    distance = Math.sqrt(realDx * realDx + realDy * realDy);
                }

                let targetVolume;
                if (distance >= config.range) {
                    targetVolume = 0;
                } else {
                    const ratio = 1 - distance / config.range;
                    const curved = this._applyCurve(ratio);
                    targetVolume = config.minVolume + (config.maxVolume - config.minVolume) * curved;
                }

                let targetPan = 0;
                const panEnabled = Params.enablePanning && config.panMode !== "off";
                if (panEnabled && config.range > 0) {
                    const panRatio = clampNumber(realDx / config.range, -1, 1);
                    targetPan = panRatio * Params.maxPanOffset;
                }

                instance.setTarget(clampNumber(targetVolume, 0, 100), targetPan);
            });
        },

        // 每幀呼叫：處理平滑與依間隔重新計算目標值
        update() {
            if (this._sounds.size === 0) return;

            this._frameCounter++;
            if (this._frameCounter >= Params.updateInterval) {
                this._frameCounter = 0;
                this._recalculateTargets();
            }

            this._sounds.forEach(instance => instance.applySmoothing());
        }
    };

    //=========================================================================
    // 掛勾：地圖載入時掃描事件
    //=========================================================================
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        if (systemEnabled) {
            ProximitySoundManager.scanMap();
        }
    };

    //=========================================================================
    // 掛勾：每幀更新
    //=========================================================================
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        ProximitySoundManager.update();
    };

    //=========================================================================
    // 掛勾：離開地圖場景時，正確停止並釋放全部音效緩衝區
    //=========================================================================
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        ProximitySoundManager.stopAll();
        _Scene_Map_terminate.call(this);
    };

    //=========================================================================
    // 掛勾：事件切換頁面時，重新讀取距離音效設定
    //=========================================================================
    const _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function() {
        const lastPageIndex = this._pageIndex;
        _Game_Event_refresh.call(this);
        if (this._pageIndex !== lastPageIndex) {
            ProximitySoundManager.onEventPageChange(this);
        }
    };

    //=========================================================================
    // 掛勾：事件被消除時，自動停止聲音
    //=========================================================================
    const _Game_Event_erase = Game_Event.prototype.erase;
    Game_Event.prototype.erase = function() {
        ProximitySoundManager.onEventErase(this);
        _Game_Event_erase.call(this);
    };

    //=========================================================================
    // 插件指令註冊
    //=========================================================================
    PluginManager.registerCommand(PLUGIN_NAME, "reloadCurrentMap", () => {
        if (systemEnabled) {
            ProximitySoundManager.scanMap();
        }
    });

    PluginManager.registerCommand(PLUGIN_NAME, "stopAllProximitySounds", () => {
        ProximitySoundManager.stopAll();
    });

    PluginManager.registerCommand(PLUGIN_NAME, "enableProximitySoundSystem", () => {
        ProximitySoundManager.enableSystem();
    });

    PluginManager.registerCommand(PLUGIN_NAME, "disableProximitySoundSystem", () => {
        ProximitySoundManager.disableSystem();
    });

    PluginManager.registerCommand(PLUGIN_NAME, "startEventSound", args => {
        const eventId = Number(args.eventId);
        ProximitySoundManager.startEventSound(eventId);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "stopEventSound", args => {
        const eventId = Number(args.eventId);
        ProximitySoundManager.stopEventSound(eventId);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "changeEventRange", args => {
        const eventId = Number(args.eventId);
        const newRange = Number(args.newRange);
        ProximitySoundManager.changeEventRange(eventId, newRange);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "changeEventMaxVolume", args => {
        const eventId = Number(args.eventId);
        const newMaxVolume = Number(args.newMaxVolume);
        ProximitySoundManager.changeEventMaxVolume(eventId, newMaxVolume);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "setEventMute", args => {
        const eventId = Number(args.eventId);
        const mute = args.mute === "true";
        ProximitySoundManager.setEventMute(eventId, mute);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "setEventPan", args => {
        const eventId = Number(args.eventId);
        const panMode = args.panMode === "off" ? "off" : "auto";
        ProximitySoundManager.setEventPan(eventId, panMode);
    });
})();
