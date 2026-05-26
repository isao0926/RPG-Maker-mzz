//=============================================================================
// RPG Maker MZ - Quest Tracker HUD
// QuestTrackerHUD.js
// Version: 1.1.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.1.0] 任務追蹤面板 HUD - 緊貼左側、小指標、主線/支線分類、互動音效
 * @author Claude
 * @url 
 *
 * @help QuestTrackerHUD.js
 *
 * ============================================================================
 * 插件說明
 * ============================================================================
 * 此插件在地圖畫面「最左側」提供一個可展開/摺疊的任務追蹤面板。
 * 摺疊時僅顯示一個小型指標，不阻擋遊戲畫面。
 * 任務分為「主線 (main)」與「支線 (side)」兩類。
 * 任務資料保存於 $gameSystem 中，可隨存檔保留。
 *
 * 【使用方式】
 * 1. 將此檔案放入專案的 js/plugins/ 資料夾。
 * 2. 在「插件管理」中啟用 QuestTrackerHUD。
 * 3. 在事件中使用「插件指令」呼叫以下三個指令：
 *    - AddQuest      ：新增任務（可選擇 main 或 side）
 *    - UpdateQuest   ：更新任務描述/進度
 *    - CompleteQuest ：完成（移除）任務
 *
 * 【操作說明】
 * - 預設按下 Tab 鍵可切換展開/摺疊狀態。
 * - 也可用滑鼠左鍵點擊面板或指標進行切換。
 * - 當無任何任務時面板自動隱藏。
 * - 接收新任務時面板會自動展開並高亮提示。
 * - 切換、新增、完成任務皆有對應音效回饋。
 *
 * ============================================================================
 * 授權
 * ============================================================================
 * 本插件可自由使用於商業及非商業專案，無需註明出處。
 *
 * ============================================================================
 *
 * @param ---面板位置與尺寸---
 * @default
 *
 * @param panelY
 * @text 面板 Y 座標
 * @desc 面板頂端的 Y 座標（X 座標固定為 0，緊貼左邊）
 * @type number
 * @min 0
 * @default 80
 * @parent ---面板位置與尺寸---
 *
 * @param panelWidth
 * @text 展開時寬度
 * @desc 展開時面板的寬度（像素）
 * @type number
 * @min 100
 * @default 320
 * @parent ---面板位置與尺寸---
 *
 * @param panelHeight
 * @text 展開時高度
 * @desc 展開時面板的最大高度（像素）
 * @type number
 * @min 100
 * @default 420
 * @parent ---面板位置與尺寸---
 *
 * @param indicatorSize
 * @text 摺疊指標大小
 * @desc 摺疊時小指標的尺寸（正方形邊長，像素）
 * @type number
 * @min 16
 * @max 80
 * @default 36
 * @parent ---面板位置與尺寸---
 *
 * @param indicatorIcon
 * @text 摺疊指標圖示
 * @desc 摺疊時顯示的小圖示（單個 emoji 或字元）
 * @type string
 * @default 📜
 * @parent ---面板位置與尺寸---
 *
 * @param ---視覺設定---
 * @default
 *
 * @param fontSize
 * @text 字體大小
 * @desc 任務描述文字的字體大小
 * @type number
 * @min 10
 * @default 18
 * @parent ---視覺設定---
 *
 * @param titleFontSize
 * @text 標題字體大小
 * @desc 任務標題的字體大小
 * @type number
 * @min 10
 * @default 20
 * @parent ---視覺設定---
 *
 * @param backOpacity
 * @text 背景不透明度
 * @desc 背景的不透明度（0=完全透明, 255=完全不透明）
 * @type number
 * @min 0
 * @max 255
 * @default 170
 * @parent ---視覺設定---
 *
 * @param headerText
 * @text 面板標題文字
 * @desc 展開時顯示於面板頂端的標題
 * @type string
 * @default 📜 任務清單
 * @parent ---視覺設定---
 *
 * @param mainCategoryText
 * @text 主線標題文字
 * @desc 主線任務分類的標題
 * @type string
 * @default ★ 主線任務
 * @parent ---視覺設定---
 *
 * @param sideCategoryText
 * @text 支線標題文字
 * @desc 支線任務分類的標題
 * @type string
 * @default ◆ 支線任務
 * @parent ---視覺設定---
 *
 * @param mainTitleColor
 * @text 主線標題顏色
 * @desc 主線任務標題的顏色（CSS 色碼）
 * @type string
 * @default #FFD700
 * @parent ---視覺設定---
 *
 * @param sideTitleColor
 * @text 支線標題顏色
 * @desc 支線任務標題的顏色（CSS 色碼）
 * @type string
 * @default #87CEEB
 * @parent ---視覺設定---
 *
 * @param descColor
 * @text 描述顏色
 * @desc 任務描述文字的顏色（CSS 色碼）
 * @type string
 * @default #FFFFFF
 * @parent ---視覺設定---
 *
 * @param highlightColor
 * @text 高亮顏色
 * @desc 新任務高亮的背景顏色（CSS 色碼）
 * @type string
 * @default #4A90E2
 * @parent ---視覺設定---
 *
 * @param indicatorBorderColor
 * @text 指標邊框顏色
 * @desc 摺疊指標的邊框顏色（CSS 色碼）
 * @type string
 * @default #FFD700
 * @parent ---視覺設定---
 *
 * @param ---互動設定---
 * @default
 *
 * @param toggleKey
 * @text 切換按鍵
 * @desc 切換展開/摺疊的按鍵
 * @type select
 * @option Tab
 * @value tab
 * @option Page Up (Q)
 * @value pageup
 * @option Page Down (W)
 * @value pagedown
 * @option Shift
 * @value shift
 * @option Control
 * @value control
 * @default tab
 * @parent ---互動設定---
 *
 * @param highlightDuration
 * @text 高亮持續時間
 * @desc 新任務高亮顯示的時間（影格，60 = 1 秒）
 * @type number
 * @min 30
 * @default 180
 * @parent ---互動設定---
 *
 * @param autoExpandOnNew
 * @text 新任務時自動展開
 * @desc 接收到新任務時是否自動展開面板
 * @type boolean
 * @default true
 * @parent ---互動設定---
 *
 * @param hideWhenEmpty
 * @text 無任務時自動隱藏
 * @desc 當清單為空時自動隱藏整個面板（包括指標）
 * @type boolean
 * @default true
 * @parent ---互動設定---
 *
 * @param ---音效設定---
 * @default
 *
 * @param enableSound
 * @text 啟用音效
 * @desc 是否啟用互動音效
 * @type boolean
 * @default true
 * @parent ---音效設定---
 *
 * @param soundToggle
 * @text 切換音效
 * @desc 展開/摺疊時播放的音效檔名（位於 audio/se/）
 * @type file
 * @dir audio/se
 * @default Book2
 * @parent ---音效設定---
 *
 * @param soundToggleVolume
 * @text 切換音效音量
 * @type number
 * @min 0
 * @max 100
 * @default 80
 * @parent ---音效設定---
 *
 * @param soundTogglePitch
 * @text 切換音效音調
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @parent ---音效設定---
 *
 * @param soundAddQuest
 * @text 新增任務音效
 * @desc 接收新任務時播放的音效檔名（位於 audio/se/）
 * @type file
 * @dir audio/se
 * @default Bell3
 * @parent ---音效設定---
 *
 * @param soundAddQuestVolume
 * @text 新增任務音效音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * @parent ---音效設定---
 *
 * @param soundAddQuestPitch
 * @text 新增任務音效音調
 * @type number
 * @min 50
 * @max 150
 * @default 110
 * @parent ---音效設定---
 *
 * @param soundUpdateQuest
 * @text 更新任務音效
 * @desc 更新任務進度時播放的音效檔名
 * @type file
 * @dir audio/se
 * @default Decision1
 * @parent ---音效設定---
 *
 * @param soundUpdateQuestVolume
 * @text 更新任務音效音量
 * @type number
 * @min 0
 * @max 100
 * @default 70
 * @parent ---音效設定---
 *
 * @param soundUpdateQuestPitch
 * @text 更新任務音效音調
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @parent ---音效設定---
 *
 * @param soundCompleteQuest
 * @text 完成任務音效
 * @desc 任務完成時播放的音效檔名
 * @type file
 * @dir audio/se
 * @default Item3
 * @parent ---音效設定---
 *
 * @param soundCompleteQuestVolume
 * @text 完成任務音效音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * @parent ---音效設定---
 *
 * @param soundCompleteQuestPitch
 * @text 完成任務音效音調
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @parent ---音效設定---
 *
 * ============================================================================
 * 插件指令
 * ============================================================================
 *
 * @command AddQuest
 * @text 新增任務
 * @desc 新增一個任務到追蹤面板
 *
 * @arg questId
 * @text 任務 ID
 * @desc 任務的唯一識別 ID（用於後續更新與完成）
 * @type string
 * @default quest_001
 *
 * @arg category
 * @text 任務類型
 * @desc 任務的分類（主線或支線）
 * @type select
 * @option 主線任務
 * @value main
 * @option 支線任務
 * @value side
 * @default main
 *
 * @arg title
 * @text 任務標題
 * @desc 任務的標題
 * @type string
 * @default 新任務
 *
 * @arg description
 * @text 任務描述
 * @desc 任務的描述或進度提示
 * @type multiline_string
 * @default 任務描述內容
 *
 *
 * @command UpdateQuest
 * @text 更新任務進度
 * @desc 更新指定任務的描述或進度
 *
 * @arg questId
 * @text 任務 ID
 * @desc 要更新的任務 ID
 * @type string
 * @default quest_001
 *
 * @arg description
 * @text 新的任務描述
 * @desc 更新後的任務描述（例如：打敗史萊姆 1/3）
 * @type multiline_string
 * @default 新的任務進度
 *
 *
 * @command CompleteQuest
 * @text 完成/移除任務
 * @desc 將指定任務從面板移除
 *
 * @arg questId
 * @text 任務 ID
 * @desc 要完成或移除的任務 ID
 * @type string
 * @default quest_001
 *
 */

(() => {
    'use strict';

    const pluginName = 'QuestTrackerHUD';
    const parameters = PluginManager.parameters(pluginName);

    // 讀取插件參數
    const Params = {
        panelY:               Number(parameters['panelY'] || 80),
        panelWidth:           Number(parameters['panelWidth'] || 320),
        panelHeight:          Number(parameters['panelHeight'] || 420),
        indicatorSize:        Number(parameters['indicatorSize'] || 36),
        indicatorIcon:        String(parameters['indicatorIcon'] || '📜'),
        fontSize:             Number(parameters['fontSize'] || 18),
        titleFontSize:        Number(parameters['titleFontSize'] || 20),
        backOpacity:          Number(parameters['backOpacity'] || 170),
        headerText:           String(parameters['headerText'] || '📜 任務清單'),
        mainCategoryText:     String(parameters['mainCategoryText'] || '★ 主線任務'),
        sideCategoryText:     String(parameters['sideCategoryText'] || '◆ 支線任務'),
        mainTitleColor:       String(parameters['mainTitleColor'] || '#FFD700'),
        sideTitleColor:       String(parameters['sideTitleColor'] || '#87CEEB'),
        descColor:            String(parameters['descColor'] || '#FFFFFF'),
        highlightColor:       String(parameters['highlightColor'] || '#4A90E2'),
        indicatorBorderColor: String(parameters['indicatorBorderColor'] || '#FFD700'),
        toggleKey:            String(parameters['toggleKey'] || 'tab'),
        highlightDuration:    Number(parameters['highlightDuration'] || 180),
        autoExpandOnNew:      String(parameters['autoExpandOnNew']) === 'true',
        hideWhenEmpty:        String(parameters['hideWhenEmpty']) === 'true',
        enableSound:          String(parameters['enableSound']) === 'true',
        soundToggle:          String(parameters['soundToggle'] || 'Book2'),
        soundToggleVolume:    Number(parameters['soundToggleVolume'] || 80),
        soundTogglePitch:     Number(parameters['soundTogglePitch'] || 100),
        soundAddQuest:        String(parameters['soundAddQuest'] || 'Bell3'),
        soundAddQuestVolume:  Number(parameters['soundAddQuestVolume'] || 90),
        soundAddQuestPitch:   Number(parameters['soundAddQuestPitch'] || 110),
        soundUpdateQuest:     String(parameters['soundUpdateQuest'] || 'Decision1'),
        soundUpdateQuestVolume: Number(parameters['soundUpdateQuestVolume'] || 70),
        soundUpdateQuestPitch:  Number(parameters['soundUpdateQuestPitch'] || 100),
        soundCompleteQuest:   String(parameters['soundCompleteQuest'] || 'Item3'),
        soundCompleteQuestVolume: Number(parameters['soundCompleteQuestVolume'] || 90),
        soundCompleteQuestPitch:  Number(parameters['soundCompleteQuestPitch'] || 100)
    };

    //=========================================================================
    // SoundHelper - 音效播放輔助
    //=========================================================================
    const SoundHelper = {
        play(name, volume, pitch) {
            if (!Params.enableSound) return;
            if (!name) return;
            try {
                AudioManager.playSe({
                    name: name,
                    volume: volume,
                    pitch: pitch,
                    pan: 0
                });
            } catch (e) {
                // 若音效檔案不存在則靜默忽略，不中斷遊戲
                console.warn(`[QuestTrackerHUD] 音效播放失敗: ${name}`);
            }
        },
        playToggle()   { this.play(Params.soundToggle, Params.soundToggleVolume, Params.soundTogglePitch); },
        playAdd()      { this.play(Params.soundAddQuest, Params.soundAddQuestVolume, Params.soundAddQuestPitch); },
        playUpdate()   { this.play(Params.soundUpdateQuest, Params.soundUpdateQuestVolume, Params.soundUpdateQuestPitch); },
        playComplete() { this.play(Params.soundCompleteQuest, Params.soundCompleteQuestVolume, Params.soundCompleteQuestPitch); }
    };

    //=========================================================================
    // Input - 註冊自訂按鍵
    //=========================================================================
    if (Params.toggleKey === 'tab') {
        Input.keyMapper[9] = 'questTracker';
    }

    //=========================================================================
    // Game_System - 任務資料存儲（隨存檔保存）
    //=========================================================================
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initQuestTracker();
    };

    Game_System.prototype.initQuestTracker = function() {
        if (this._questList === undefined) {
            this._questList = [];
            this._questTrackerExpanded = false;  // 預設摺疊（只顯示小指標）
            this._questTrackerNewFlag = false;
        }
    };

    Game_System.prototype.questList = function() {
        if (this._questList === undefined) this.initQuestTracker();
        return this._questList;
    };

    // 取得分類後的任務清單
    Game_System.prototype.questsByCategory = function(category) {
        return this.questList().filter(q => q.category === category);
    };

    Game_System.prototype.addQuest = function(id, title, description, category) {
        if (this._questList === undefined) this.initQuestTracker();
        // 若已存在同 ID 任務則先移除（避免重複）
        this._questList = this._questList.filter(q => q.id !== id);
        const quest = {
            id: id,
            title: title,
            description: description,
            category: (category === 'side') ? 'side' : 'main',  // 預設主線
            isNew: true,
            highlightFrame: Params.highlightDuration
        };
        this._questList.push(quest);
        this._questTrackerNewFlag = true;
        SoundHelper.playAdd();
    };

    Game_System.prototype.updateQuest = function(id, description) {
        if (this._questList === undefined) this.initQuestTracker();
        const quest = this._questList.find(q => q.id === id);
        if (quest) {
            quest.description = description;
            quest.highlightFrame = Math.floor(Params.highlightDuration / 2);
            SoundHelper.playUpdate();
        }
    };

    Game_System.prototype.completeQuest = function(id) {
        if (this._questList === undefined) this.initQuestTracker();
        const found = this._questList.some(q => q.id === id);
        this._questList = this._questList.filter(q => q.id !== id);
        if (found) {
            SoundHelper.playComplete();
        }
    };

    Game_System.prototype.isQuestTrackerExpanded = function() {
        if (this._questTrackerExpanded === undefined) this._questTrackerExpanded = false;
        return this._questTrackerExpanded;
    };

    Game_System.prototype.setQuestTrackerExpanded = function(value) {
        this._questTrackerExpanded = value;
    };

    Game_System.prototype.toggleQuestTracker = function() {
        this._questTrackerExpanded = !this.isQuestTrackerExpanded();
    };

    Game_System.prototype.consumeQuestNewFlag = function() {
        const flag = this._questTrackerNewFlag;
        this._questTrackerNewFlag = false;
        return flag;
    };

    //=========================================================================
    // PluginManager - 註冊插件指令
    //=========================================================================
    PluginManager.registerCommand(pluginName, 'AddQuest', args => {
        const id = String(args.questId || '');
        const title = String(args.title || '');
        const description = String(args.description || '');
        const category = String(args.category || 'main');
        if (id) {
            $gameSystem.addQuest(id, title, description, category);
        }
    });

    PluginManager.registerCommand(pluginName, 'UpdateQuest', args => {
        const id = String(args.questId || '');
        const description = String(args.description || '');
        if (id) {
            $gameSystem.updateQuest(id, description);
        }
    });

    PluginManager.registerCommand(pluginName, 'CompleteQuest', args => {
        const id = String(args.questId || '');
        if (id) {
            $gameSystem.completeQuest(id);
        }
    });

    //=========================================================================
    // Window_QuestTracker - 任務追蹤面板視窗
    //=========================================================================
    function Window_QuestTracker() {
        this.initialize(...arguments);
    }

    Window_QuestTracker.prototype = Object.create(Window_Base.prototype);
    Window_QuestTracker.prototype.constructor = Window_QuestTracker;

    Window_QuestTracker.prototype.initialize = function() {
        const rect = this.windowRect();
        Window_Base.prototype.initialize.call(this, rect);
        this.opacity = 0;
        this.contentsOpacity = 255;
        this._lastQuestData = '';
        this._needRefresh = false;
        this.refresh();
    };

    Window_QuestTracker.prototype.windowRect = function() {
        const expanded = $gameSystem && $gameSystem.isQuestTrackerExpanded();
        // X 固定為 0，緊貼最左邊
        if (expanded) {
            return new Rectangle(0, Params.panelY, Params.panelWidth, Params.panelHeight);
        } else {
            return new Rectangle(0, Params.panelY, Params.indicatorSize, Params.indicatorSize);
        }
    };

    Window_QuestTracker.prototype.updatePadding = function() {
        this.padding = 4;
    };

    Window_QuestTracker.prototype._refreshBack = function() {
        // 跳過預設背景，由 contents 自繪
    };

    Window_QuestTracker.prototype.refresh = function() {
        const rect = this.windowRect();
        this.move(rect.x, rect.y, rect.width, rect.height);
        this.createContents();
        this.drawPanel();
    };

    Window_QuestTracker.prototype.drawPanel = function() {
        this.contents.clear();
        const expanded = $gameSystem.isQuestTrackerExpanded();
        if (!expanded) {
            this.drawIndicator();
        } else {
            this.drawExpanded();
        }
    };

    // 繪製摺疊狀態的小指標
    Window_QuestTracker.prototype.drawIndicator = function() {
        const w = this.contents.width;
        const h = this.contents.height;

        // 圓角矩形背景
        const bgColor = `rgba(0, 0, 0, ${Params.backOpacity / 255})`;
        this.contents.fillRect(0, 0, w, h, bgColor);

        // 右側與底部邊框（突顯靠左貼邊的效果）
        const borderColor = this.hexToRgba(Params.indicatorBorderColor, 0.8);
        this.contents.fillRect(w - 2, 0, 2, h, borderColor);
        this.contents.fillRect(0, h - 2, w, 2, borderColor);
        this.contents.fillRect(0, 0, w, 2, borderColor);

        // 若有未檢視的新任務則閃爍
        const hasNew = $gameSystem.questList().some(q => q.highlightFrame > 0);
        if (hasNew) {
            const pulse = (Math.sin(Graphics.frameCount / 8) + 1) / 2;
            const highlight = this.hexToRgba(Params.highlightColor, pulse * 0.5);
            this.contents.fillRect(0, 0, w, h, highlight);
        }

        // 繪製圖示
        const iconSize = Math.floor(h * 0.55);
        this.contents.fontSize = iconSize;
        this.contents.textColor = Params.mainTitleColor;
        this.contents.drawText(Params.indicatorIcon, 0, (h - iconSize - 6) / 2, w, iconSize + 6, 'center');

        // 顯示任務數量徽章
        const count = $gameSystem.questList().length;
        if (count > 0) {
            const badgeSize = Math.max(14, Math.floor(h * 0.35));
            const bx = w - badgeSize - 1;
            const by = 1;
            this.contents.fillRect(bx, by, badgeSize, badgeSize, '#E74C3C');
            this.contents.fontSize = Math.floor(badgeSize * 0.7);
            this.contents.textColor = '#FFFFFF';
            this.contents.drawText(String(count), bx, by - 1, badgeSize, badgeSize, 'center');
        }

        this.resetFontSettings();
    };

    // 繪製展開狀態的完整面板
    Window_QuestTracker.prototype.drawExpanded = function() {
        const w = this.contents.width;
        const h = this.contents.height;

        // 半透明背景
        this.contents.fillRect(0, 0, w, h, `rgba(0, 0, 0, ${Params.backOpacity / 255})`);

        // 右側邊框（強調貼邊感）
        this.contents.fillRect(w - 2, 0, 2, h, this.hexToRgba(Params.indicatorBorderColor, 0.8));

        let y = 6;

        // 主標題
        this.contents.fontSize = Params.titleFontSize;
        this.contents.textColor = Params.mainTitleColor;
        this.contents.drawText(Params.headerText, 8, y, w - 16, Params.titleFontSize + 6, 'left');
        y += Params.titleFontSize + 8;

        // 分隔線
        this.contents.fillRect(8, y, w - 16, 2, this.hexToRgba(Params.indicatorBorderColor, 0.6));
        y += 8;

        const mainQuests = $gameSystem.questsByCategory('main');
        const sideQuests = $gameSystem.questsByCategory('side');

        // 主線分類
        if (mainQuests.length > 0) {
            y = this.drawCategoryHeader(y, Params.mainCategoryText, Params.mainTitleColor);
            for (const quest of mainQuests) {
                if (y + this.questBlockHeight(quest) > h - 4) break;
                y = this.drawQuestBlock(quest, y, Params.mainTitleColor);
            }
            y += 4;
        }

        // 支線分類
        if (sideQuests.length > 0) {
            y = this.drawCategoryHeader(y, Params.sideCategoryText, Params.sideTitleColor);
            for (const quest of sideQuests) {
                if (y + this.questBlockHeight(quest) > h - 4) break;
                y = this.drawQuestBlock(quest, y, Params.sideTitleColor);
            }
        }

        // 若無任何任務（理論上不會走到這裡因為 hideWhenEmpty 已隱藏）
        if (mainQuests.length === 0 && sideQuests.length === 0) {
            this.contents.fontSize = Params.fontSize;
            this.contents.textColor = Params.descColor;
            this.contents.drawText('（目前沒有任務）', 8, y, w - 16, Params.fontSize + 6, 'center');
        }

        this.resetFontSettings();
    };

    // 繪製分類標題列
    Window_QuestTracker.prototype.drawCategoryHeader = function(y, text, color) {
        const w = this.contents.width;
        this.contents.fontSize = Params.fontSize + 2;
        this.contents.textColor = color;
        this.contents.drawText(text, 6, y, w - 12, Params.fontSize + 6, 'left');
        y += Params.fontSize + 6;
        // 細分隔線
        this.contents.fillRect(8, y, w - 16, 1, this.hexToRgba(color, 0.4));
        y += 6;
        return y;
    };

    // 繪製單一任務區塊
    Window_QuestTracker.prototype.drawQuestBlock = function(quest, y, titleColor) {
        const w = this.contents.width;
        const blockHeight = this.questBlockHeight(quest);

        // 高亮背景
        if (quest.highlightFrame && quest.highlightFrame > 0) {
            const alpha = Math.min(1, quest.highlightFrame / Params.highlightDuration) * 0.6;
            const rgba = this.hexToRgba(Params.highlightColor, alpha);
            this.contents.fillRect(4, y - 2, w - 8, blockHeight, rgba);
        }

        // 任務標題
        this.contents.fontSize = Params.fontSize + 1;
        this.contents.textColor = titleColor;
        this.contents.drawText('▸ ' + quest.title, 10, y, w - 18, Params.fontSize + 6);
        y += Params.fontSize + 6;

        // 任務描述
        this.contents.fontSize = Params.fontSize;
        this.contents.textColor = Params.descColor;
        const descLines = this.wrapText(quest.description, w - 32);
        for (const line of descLines) {
            if (y + Params.fontSize > this.contents.height - 4) break;
            this.contents.drawText(line, 22, y, w - 30, Params.fontSize + 4);
            y += Params.fontSize + 4;
        }

        return y + 6;
    };

    Window_QuestTracker.prototype.questBlockHeight = function(quest) {
        const descLines = this.wrapText(quest.description, this.contents.width - 32);
        return (Params.fontSize + 6) + descLines.length * (Params.fontSize + 4) + 6;
    };

    // 簡易文字換行
    Window_QuestTracker.prototype.wrapText = function(text, maxWidth) {
        if (!text) return [''];
        const result = [];
        const paragraphs = String(text).split(/\r?\n/);
        for (const para of paragraphs) {
            if (para.length === 0) {
                result.push('');
                continue;
            }
            let line = '';
            for (let i = 0; i < para.length; i++) {
                const testLine = line + para[i];
                if (this.contents.measureTextWidth(testLine) > maxWidth && line.length > 0) {
                    result.push(line);
                    line = para[i];
                } else {
                    line = testLine;
                }
            }
            if (line.length > 0) result.push(line);
        }
        return result;
    };

    Window_QuestTracker.prototype.hexToRgba = function(hex, alpha) {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    Window_QuestTracker.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        this.updateHighlight();
        this.checkRefresh();
        this.processToggleInput();
        this.processTouchInput();
        this.updateVisibility();
    };

    Window_QuestTracker.prototype.updateHighlight = function() {
        const list = $gameSystem.questList();
        let hasHighlight = false;
        for (const quest of list) {
            if (quest.highlightFrame && quest.highlightFrame > 0) {
                quest.highlightFrame--;
                hasHighlight = true;
                if (quest.highlightFrame === 0) {
                    this._needRefresh = true;
                }
            }
        }
        // 高亮期間每 4 影格刷新一次以呈現淡出
        // 摺疊指標也需要持續刷新以呈現脈衝效果
        if (hasHighlight) {
            this._highlightTick = (this._highlightTick || 0) + 1;
            if (this._highlightTick % 4 === 0) {
                this._needRefresh = true;
            }
        }
    };

    Window_QuestTracker.prototype.checkRefresh = function() {
        const list = $gameSystem.questList();
        const dataString = JSON.stringify(list.map(q => ({
            id: q.id, title: q.title, desc: q.description, cat: q.category
        }))) + '|' + $gameSystem.isQuestTrackerExpanded();

        if (dataString !== this._lastQuestData || this._needRefresh) {
            this._lastQuestData = dataString;
            this._needRefresh = false;
            this.refresh();
        }

        if ($gameSystem.consumeQuestNewFlag()) {
            if (Params.autoExpandOnNew && !$gameSystem.isQuestTrackerExpanded()) {
                $gameSystem.setQuestTrackerExpanded(true);
                this.refresh();
            }
        }
    };

    Window_QuestTracker.prototype.processToggleInput = function() {
        if (!this.visible) return;
        if (Input.isTriggered('questTracker') || Input.isTriggered(Params.toggleKey)) {
            this.toggle();
        }
    };

    Window_QuestTracker.prototype.processTouchInput = function() {
        if (!this.visible) return;
        if (TouchInput.isTriggered()) {
            const x = TouchInput.x;
            const y = TouchInput.y;
            if (x >= this.x && x < this.x + this.width &&
                y >= this.y && y < this.y + this.height) {
                this.toggle();
                TouchInput.clear();
            }
        }
    };

    Window_QuestTracker.prototype.toggle = function() {
        $gameSystem.toggleQuestTracker();
        SoundHelper.playToggle();
        this.refresh();
    };

    Window_QuestTracker.prototype.updateVisibility = function() {
        const list = $gameSystem.questList();
        if (Params.hideWhenEmpty && list.length === 0) {
            this.visible = false;
        } else {
            this.visible = true;
        }
    };

    //=========================================================================
    // Scene_Map - 將任務面板加入地圖場景
    //=========================================================================
    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createQuestTrackerWindow();
    };

    Scene_Map.prototype.createQuestTrackerWindow = function() {
        this._questTrackerWindow = new Window_QuestTracker();
        this.addChild(this._questTrackerWindow);
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (this._questTrackerWindow) {
            const msgActive = this._messageWindow && this._messageWindow.isOpen();
            if (msgActive) {
                this._questTrackerWindow.contentsOpacity = 80;
            } else {
                this._questTrackerWindow.contentsOpacity = 255;
            }
        }
    };

    //=========================================================================
    // Scene_Boot - 確保按鍵綁定在啟動時生效
    //=========================================================================
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        if (Params.toggleKey === 'tab') {
            Input.keyMapper[9] = 'questTracker';
        }
    };

})();
