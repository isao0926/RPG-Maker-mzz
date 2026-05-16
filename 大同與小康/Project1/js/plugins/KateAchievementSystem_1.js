//=============================================================================
// KateAchievementSystem.js
// 版本：1.0.0
// 作者：SeeMi Studio
//=============================================================================

/*:
 * @target MZ
 * @plugindesc v1.0 成就系統 ─ 解鎖成就時於右下角顯示動態提示視窗
 * @author SeeMi Studio
 *
 * @param achievementList
 * @text 成就資料庫
 * @type struct<Achievement>[]
 * @default []
 * @desc 設定遊戲中所有的成就內容。每筆資料需填寫 ID、名稱、敘述與圖示。
 *
 * @param seName
 * @text 預設音效檔名 (SE Name)
 * @type file
 * @dir audio/se/
 * @default Chime2
 * @desc 解鎖成就時播放的 SE 音效檔名（不含副檔名）。
 *
 * @param seVolume
 * @text 預設音效音量 (SE Volume)
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * @desc 解鎖音效的音量（0 ~ 100）。
 *
 * @param sePitch
 * @text 預設音效音調 (SE Pitch)
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @desc 解鎖音效的音調（50 ~ 150）。
 *
 * @param windowWidth
 * @text 提示視窗寬度 (Window Width)
 * @type number
 * @min 100
 * @default 360
 * @desc 成就提示視窗的寬度（像素）。
 *
 * @param windowHeight
 * @text 提示視窗高度 (Window Height)
 * @type number
 * @min 60
 * @default 100
 * @desc 成就提示視窗的高度（像素）。
 *
 * @param marginRight
 * @text 右側邊距
 * @type number
 * @min 0
 * @default 16
 * @desc 提示視窗距螢幕右側的距離（像素）。
 *
 * @param marginBottom
 * @text 底部邊距
 * @type number
 * @min 0
 * @default 16
 * @desc 提示視窗距螢幕底部的距離（像素）。
 *
 * @param slideDistance
 * @text 滑動距離
 * @type number
 * @min 10
 * @default 60
 * @desc 提示視窗滑入/滑出時的水平位移量（像素）。
 *
 * @param fadeInFrames
 * @text 淡入幀數
 * @type number
 * @min 1
 * @default 20
 * @desc 滑入動畫持續的幀數（60fps 下 20 幀 ≈ 0.33 秒）。
 *
 * @param stayFrames
 * @text 停留幀數
 * @type number
 * @min 30
 * @default 180
 * @desc 提示視窗停留的幀數（預設 180 幀 = 3 秒）。
 *
 * @param fadeOutFrames
 * @text 淡出幀數
 * @type number
 * @min 1
 * @default 20
 * @desc 滑出動畫持續的幀數。
 *
 * @help
 * ═══════════════════════════════════════════════════════
 *  成就系統插件 v1.0  |  Achievement System Plugin
 *  for RPG Maker MZ
 * ═══════════════════════════════════════════════════════
 *
 * 【功能概述】
 *   ・解鎖成就時，於畫面右下角顯示帶動畫的提示視窗
 *   ・支援成就圖示、名稱與敘述文字
 *   ・提示音效可自訂
 *   ・解鎖狀態自動整合至遊戲存檔
 *   ・在地圖與戰鬥場景均可正常運作
 *
 * 【腳本呼叫方式】
 *
 *   ▶ 解鎖成就（在「腳本」事件指令中呼叫）：
 *     AchievementManager.unlock(1);
 *     → 解鎖 ID 為 1 的成就並顯示提示視窗
 *
 *   ▶ 查詢成就是否已解鎖：
 *     AchievementManager.isUnlocked(1);
 *     → 回傳 true（已解鎖）或 false（未解鎖）
 *
 *   ▶ 取得成就資料物件：
 *     AchievementManager.getAchievement(1);
 *     → 回傳 { id, name, description, iconIndex } 或 null
 *
 * 【成就資料庫設定】
 *   請在插件管理員的「成就資料庫」欄位中新增成就，
 *   每筆成就包含：
 *     - 成就 ID（唯一數字，不可重複）
 *     - 成就名稱
 *     - 成就敘述
 *     - 圖示 ID（對應 IconSet，填 0 則不顯示）
 *
 * 【存檔說明】
 *   解鎖狀態會自動隨遊戲存檔儲存，讀取存檔後自動還原，
 *   無需額外設定。
 *
 * ═══════════════════════════════════════════════════════
 */

/*~struct~Achievement:
 * @param id
 * @text 成就 ID
 * @type number
 * @min 1
 * @default 1
 * @desc 成就的唯一識別碼，同一遊戲中不可重複。
 *
 * @param name
 * @text 成就名稱
 * @type string
 * @default 我的第一個成就
 * @desc 顯示於提示視窗中央的成就標題（建議 15 字以內）。
 *
 * @param description
 * @text 成就敘述
 * @type string
 * @default 完成了一件了不起的事情。
 * @desc 顯示於名稱下方的說明文字（建議 30 字以內）。
 *
 * @param iconIndex
 * @text 圖示 ID
 * @type number
 * @min 0
 * @default 0
 * @desc 對應 IconSet.png 的圖示編號（填 0 則不顯示圖示）。
 */

(() => {
  'use strict';

  //===========================================================================
  // ■ 插件名稱 & 讀取參數
  //===========================================================================

  // ── 插件名稱必須與檔案名稱（不含 .js）完全一致 ──
  // 你的檔案名稱是 KateAchievementSystem_1.js，所以這裡填 _1
  const PLUGIN_NAME = 'KateAchievementSystem_1';
  const params = PluginManager.parameters(PLUGIN_NAME);

  /**
   * Param：整理後的插件參數物件。
   * 所有數值型參數皆用 Number() 轉換，字串型用 String() 轉換，
   * 陣列型（achievementList）則逐層 JSON.parse。
   */
  const Param = {
    /**
     * 成就資料庫（陣列）
     * 格式：[{ id, name, description, iconIndex }, ...]
     */
    achievementList: (() => {
      try {
        return JSON.parse(params['achievementList'] || '[]').map(str => JSON.parse(str));
      } catch (e) {
        console.error('[KateAchievementSystem] 解析成就資料庫時發生錯誤：', e);
        return [];
      }
    })(),

    // ── 音效設定 ──
    seName:   String(params['seName']   || 'Chime2'),
    seVolume: Number(params['seVolume'] || 90),
    sePitch:  Number(params['sePitch']  || 100),

    // ── 視窗尺寸 ──
    windowWidth:  Number(params['windowWidth']  || 360),
    windowHeight: Number(params['windowHeight'] || 100),
    marginRight:  Number(params['marginRight']  || 16),
    marginBottom: Number(params['marginBottom'] || 16),

    // ── 動畫設定 ──
    slideDistance: Number(params['slideDistance'] || 60),
    fadeInFrames:  Number(params['fadeInFrames']  || 20),
    stayFrames:    Number(params['stayFrames']    || 180),
    fadeOutFrames: Number(params['fadeOutFrames'] || 20),
  };

  //===========================================================================
  // ■ AchievementManager（全域成就管理器）
  //===========================================================================
  //
  // 使用說明（腳本事件中呼叫）：
  //   AchievementManager.unlock(1);       // 解鎖成就
  //   AchievementManager.isUnlocked(1);   // 查詢是否已解鎖
  //   AchievementManager.getAchievement(1); // 取得成就資料
  //
  //===========================================================================

  const AchievementManager = {

    //-------------------------------------------------------------------------
    // 私有屬性
    //-------------------------------------------------------------------------

    /** @type {Set<number>} 已解鎖成就的 ID 集合 */
    _unlockedIds: new Set(),

    /** @type {Map<number, Object>|null} 成就資料庫的快取（懶加載，首次存取時建立） */
    _databaseCache: null,

    //-------------------------------------------------------------------------
    // 屬性 getter：成就資料庫
    //-------------------------------------------------------------------------

    /**
     * 取得成就資料庫（Map<id, achievementObject>）。
     * 使用懶加載：首次存取時從 Param.achievementList 建立並快取。
     * @returns {Map<number, Object>}
     */
    get _database() {
      if (!this._databaseCache) {
        this._databaseCache = new Map();
        for (const item of Param.achievementList) {
          const id = Number(item.id);
          if (isNaN(id) || id <= 0) {
            console.warn(`[AchievementManager] 無效的成就 ID：${item.id}，跳過此筆資料。`);
            continue;
          }
          this._databaseCache.set(id, {
            id,
            name:        String(item.name        || '未命名成就'),
            description: String(item.description || ''),
            iconIndex:   Number(item.iconIndex   || 0),
          });
        }
      }
      return this._databaseCache;
    },

    //-------------------------------------------------------------------------
    // 公開 API
    //-------------------------------------------------------------------------

    /**
     * 解鎖指定 ID 的成就。
     *
     * 行為：
     *   1. 若成就已解鎖 → 靜默略過（不重複觸發）
     *   2. 若找不到對應資料 → 主控台警告，並略過
     *   3. 成功解鎖 → 標記已解鎖、播放音效、顯示提示視窗
     *
     * @param {number} id 成就 ID（對應插件參數中設定的 ID）
     */
    unlock(id) {
      id = Number(id);

      // ── 已解鎖則略過 ──
      if (this._unlockedIds.has(id)) return;

      // ── 查詢成就資料 ──
      const achievement = this._database.get(id);
      if (!achievement) {
        console.warn(
          `[AchievementManager] 找不到 ID = ${id} 的成就。` +
          `請確認插件管理員的「成就資料庫」中已設定此 ID。`
        );
        return;
      }

      // ── 標記為已解鎖 ──
      this._unlockedIds.add(id);

      // ── 播放解鎖音效 ──
      this._playSE();

      // ── 顯示提示視窗 ──
      this._showToast(achievement);
    },

    /**
     * 查詢指定成就是否已解鎖。
     * @param {number} id 成就 ID
     * @returns {boolean} true = 已解鎖，false = 尚未解鎖
     */
    isUnlocked(id) {
      return this._unlockedIds.has(Number(id));
    },

    /**
     * 取得指定成就的資料物件。
     * @param {number} id 成就 ID
     * @returns {{ id: number, name: string, description: string, iconIndex: number } | null}
     */
    getAchievement(id) {
      return this._database.get(Number(id)) || null;
    },

    //-------------------------------------------------------------------------
    // 私有方法
    //-------------------------------------------------------------------------

    /**
     * 播放成就解鎖音效。
     * 音效來源：插件參數 seName / seVolume / sePitch。
     */
    _playSE() {
      AudioManager.playSe({
        name:   Param.seName,
        volume: Param.seVolume,
        pitch:  Param.sePitch,
        pan:    0,           // 不左右偏移
      });
    },

    /**
     * 在當前場景建立成就提示視窗並顯示。
     *
     * 若當前場景不存在（如場景切換中），則略過。
     * 若已有多個提示同時顯示，則往上堆疊（垂直偏移）。
     *
     * @param {Object} achievement 成就資料物件
     */
    _showToast(achievement) {
      const scene = SceneManager._scene;
      if (!scene) return; // 場景不存在時略過

      // 初始化場景上的提示追蹤陣列（防禦性措施）
      if (!scene._achievementToasts) {
        scene._achievementToasts = [];
      }

      // 清除已完成銷毀的提示，保持陣列乾淨
      scene._achievementToasts = scene._achievementToasts.filter(t => !t._achievementDone);

      // 根據目前顯示中的提示數量計算垂直堆疊偏移
      // 每個新提示往上移，避免互相重疊
      const existingCount = scene._achievementToasts.length;
      const yOffset = existingCount * (Param.windowHeight + 8);

      // 建立提示視窗並加入場景（addChild 確保顯示於最上層）
      const toast = new Window_AchievementToast(achievement, yOffset);
      scene._achievementToasts.push(toast);
      scene.addChild(toast); // 加入場景 children，可自動接收 update 呼叫
    },

    //-------------------------------------------------------------------------
    // 存檔 / 讀檔整合
    //-------------------------------------------------------------------------

    /**
     * 產生存檔用的成就資料。
     * 由 DataManager.makeSaveContents 呼叫。
     * @returns {number[]} 已解鎖成就 ID 的陣列
     */
    makeSaveData() {
      return Array.from(this._unlockedIds);
    },

    /**
     * 從存檔資料還原成就解鎖狀態。
     * 由 DataManager.extractSaveContents 呼叫。
     * @param {number[]} data 存檔中的已解鎖 ID 陣列
     */
    loadSaveData(data) {
      this._unlockedIds = new Set(Array.isArray(data) ? data.map(Number) : []);
    },

    /**
     * 重置成就狀態（新遊戲開始時呼叫）。
     */
    initialize() {
      this._unlockedIds = new Set();
    },
  };

  // ── 將管理器暴露至全域，讓腳本事件可直接呼叫 ──
  window.AchievementManager = AchievementManager;

  //===========================================================================
  // ■ Window_AchievementToast（成就提示視窗）
  //
  // 動畫流程：
  //   [slidein]  從右側畫面外 easeOutCubic 滑入，同時淡入
  //       ↓
  //   [stay]     停留 stayFrames 幀
  //       ↓
  //   [slideout] easeInCubic 滑出至右側畫面外，同時淡出
  //       ↓
  //   [done]     從 scene 移除自身並呼叫 destroy()
  //
  // 視窗佈局（由上至下）：
  //   [圖示（可選）] ★ 成就解鎖！
  //                  成就名稱（較大加粗字體）
  //                  成就敘述（較小灰色字體）
  //===========================================================================

  class Window_AchievementToast extends Window_Base {

    /**
     * @param {Object} achievement 成就資料（含 id, name, description, iconIndex）
     * @param {number} yOffset     垂直偏移量，用於多個提示同時顯示時向上堆疊
     */
    constructor(achievement, yOffset = 0) {
      const w  = Param.windowWidth;
      const h  = Param.windowHeight;
      const mr = Param.marginRight;
      const mb = Param.marginBottom;

      // 計算目標位置（右下角）
      const targetX = Graphics.width  - w - mr;
      const targetY = Graphics.height - h - mb - yOffset;

      // 計算起始位置（從畫面右側外部滑入）
      const startX = Graphics.width + Param.slideDistance;

      // 呼叫父類別建構子，以初始位置（startX）建立視窗
      super(new Rectangle(startX, targetY, w, h));

      //-----------------------------------------------------------------------
      // 實例屬性
      //-----------------------------------------------------------------------

      /** @type {Object} 成就資料 */
      this._achievement = achievement;

      /** @type {number} 動畫的目標 X 座標（視窗最終停放位置） */
      this._targetX = targetX;

      /** @type {number} 動畫的起始 X 座標（視窗從此位置滑入） */
      this._startX = startX;

      /**
       * @type {'slidein'|'stay'|'slideout'|'done'} 當前動畫階段
       *   slidein  ─ 滑入中
       *   stay     ─ 停留中
       *   slideout ─ 滑出中
       *   done     ─ 完成，等待銷毀
       */
      this._phase = 'slidein';

      /** @type {number} 當前動畫階段的幀計數器 */
      this._phaseTimer = 0;

      /**
       * @type {boolean}
       * 是否已完成動畫並銷毀自身。
       * 供 AchievementManager._showToast 清理陣列時使用。
       */
      this._achievementDone = false;

      //-----------------------------------------------------------------------
      // 初始視覺狀態
      //-----------------------------------------------------------------------

      // 初始完全透明（待動畫逐幀顯現）
      this.opacity         = 0;
      this.contentsOpacity = 0;

      //-----------------------------------------------------------------------
      // 繪製視窗內容
      //-----------------------------------------------------------------------
      this._drawContent();
    }

    //=========================================================================
    // ■ 繪製
    //=========================================================================

    /**
     * 繪製成就提示視窗的所有內容。
     *
     * 佈局說明（innerWidth × innerHeight 的內容區域）：
     *
     *  有圖示時：
     *   [  Icon  ]  ★ 成就解鎖！
     *   [32×32px ]  成就名稱（大字加粗）
     *               成就敘述（小字灰色）
     *
     *  無圖示時：
     *   ★ 成就解鎖！
     *   成就名稱（大字加粗）
     *   成就敘述（小字灰色）
     */
    _drawContent() {
      this.contents.clear();

      const iconIndex = Number(this._achievement.iconIndex || 0);
      const hasIcon   = iconIndex > 0;

      // 圖示尺寸（MZ 標準 32×32）
      const iconW = ImageManager.iconWidth  || 32;
      const iconH = ImageManager.iconHeight || 32;

      // 圖示與文字之間的水平間距
      const iconPadding = 8;

      // 文字繪製的起始 X 座標（有圖示時向右偏移）
      const textX = hasIcon ? iconW + iconPadding : 0;
      const textW = this.innerWidth - textX;

      // ── 繪製圖示（垂直置中於整個內容區域）──
      if (hasIcon) {
        const iconY = Math.floor((this.innerHeight - iconH) / 2);
        this.drawIcon(iconIndex, 0, iconY);
      }

      // ── 第一行：成就解鎖標籤（13px，系統顏色） ──
      // 系統顏色通常為青/水色，視覺上有提示感
      // 注意：直接操作 this.contents.fontSize，相容所有 MZ 版本
      this.contents.fontSize = 13;
      this.changeTextColor(ColorManager.systemColor());
      this.drawText('★ 成就解鎖！', textX, 2, textW);

      // ── 第二行：成就名稱（18px，粗體，白色） ──
      this.contents.fontSize = 18;
      this.changeTextColor(ColorManager.normalColor());
      this.contents.fontBold = true;
      this.drawText(this._achievement.name, textX, 22, textW);
      this.contents.fontBold = false;

      // ── 第三行：成就敘述（13px，灰色） ──
      this.contents.fontSize = 13;
      this.changeTextColor('#a0a0a0'); // 淺灰色，與名稱形成層次感
      this.drawText(this._achievement.description, textX, 50, textW);

      // 還原至預設字體設定（避免影響其他視窗）
      this.resetFontSettings();
    }

    //=========================================================================
    // ■ 動畫更新
    //=========================================================================

    /**
     * 每幀更新。
     * 由 Scene_Base.updateChildren() 自動呼叫（因為 toast 是 scene 的 child）。
     */
    update() {
      super.update();

      // 已完成銷毀則不再執行任何邏輯（防止重複呼叫）
      if (this._achievementDone) return;

      this._phaseTimer++;

      // 根據當前動畫階段分派邏輯
      switch (this._phase) {
        case 'slidein':  this._updateSlideIn();  break;
        case 'stay':     this._updateStay();     break;
        case 'slideout': this._updateSlideOut(); break;
        case 'done':     this._finalize();       break;
      }
    }

    //-------------------------------------------------------------------------
    // 動畫階段：滑入
    //-------------------------------------------------------------------------

    /**
     * 滑入動畫：使用 easeOutCubic 緩動函數。
     * 效果：開始移動快，接近目標時減速，有「落下定位」的感覺。
     */
    _updateSlideIn() {
      const t     = this._phaseTimer;
      const total = Param.fadeInFrames;
      // 進度比例（0.0 ~ 1.0）
      const ratio = Math.min(t / total, 1);
      // easeOutCubic：f(x) = 1 - (1 - x)^3
      const eased = 1 - Math.pow(1 - ratio, 3);

      // 插值計算當前 X 位置
      this.x = Math.round(this._startX + (this._targetX - this._startX) * eased);

      // 同步更新透明度（使用線性插值即可，視覺效果已由 X 主導）
      this.opacity         = Math.round(255 * ratio);
      this.contentsOpacity = this.opacity;

      // 動畫結束：精確定位並切換至停留階段
      if (t >= total) {
        this.x               = this._targetX;
        this.opacity         = 255;
        this.contentsOpacity = 255;
        this._nextPhase('stay');
      }
    }

    //-------------------------------------------------------------------------
    // 動畫階段：停留
    //-------------------------------------------------------------------------

    /**
     * 停留階段：靜止顯示於右下角，等待計時結束後進入滑出。
     */
    _updateStay() {
      if (this._phaseTimer >= Param.stayFrames) {
        this._nextPhase('slideout');
      }
    }

    //-------------------------------------------------------------------------
    // 動畫階段：滑出
    //-------------------------------------------------------------------------

    /**
     * 滑出動畫：使用 easeInCubic 緩動函數。
     * 效果：開始移動慢，加速消失至右側，有「被拉走」的感覺。
     */
    _updateSlideOut() {
      const t     = this._phaseTimer;
      const total = Param.fadeOutFrames;
      const ratio = Math.min(t / total, 1);
      // easeInCubic：f(x) = x^3
      const eased = Math.pow(ratio, 3);

      // 插值計算當前 X 位置（從目標位置滑向起始位置右側）
      this.x = Math.round(this._targetX + (this._startX - this._targetX) * eased);

      // 同步更新透明度（線性淡出）
      this.opacity         = Math.round(255 * (1 - ratio));
      this.contentsOpacity = this.opacity;

      // 動畫結束：切換至完成階段
      if (t >= total) {
        this._nextPhase('done');
      }
    }

    //-------------------------------------------------------------------------
    // 輔助方法
    //-------------------------------------------------------------------------

    /**
     * 切換至下一個動畫階段並重置幀計數器。
     * @param {'slidein'|'stay'|'slideout'|'done'} phase 目標階段
     */
    _nextPhase(phase) {
      this._phase      = phase;
      this._phaseTimer = 0;
    }

    /**
     * 完成動畫後的清理程序：
     *   1. 標記 _achievementDone，讓 AchievementManager 知道可以從陣列移除
     *   2. 從父節點（scene）移除自身，停止接收 update 呼叫
     *   3. 呼叫 destroy() 釋放 Bitmap 等記憶體資源
     */
    _finalize() {
      this._achievementDone = true;

      // 從 Scene 的 children 移除（移除後不再被 updateChildren 呼叫）
      if (this.parent) {
        this.parent.removeChild(this);
      }

      // 釋放 Bitmap 資源（contents, contentsBack 等）
      this.destroy({ children: true });
    }

  } // End of Window_AchievementToast

  //===========================================================================
  // ■ DataManager 擴展 ─ 存檔 / 讀檔整合
  //===========================================================================

  /**
   * makeSaveContents：在存檔內容中加入成就解鎖資料。
   * RPG Maker MZ 在玩家存檔時自動呼叫此方法。
   */
  const _DataManager_makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = function() {
    const contents = _DataManager_makeSaveContents.call(this);
    // 將已解鎖的成就 ID 陣列存入存檔物件
    contents.achievementData = AchievementManager.makeSaveData();
    return contents;
  };

  /**
   * extractSaveContents：從存檔資料中還原成就解鎖狀態。
   * RPG Maker MZ 在玩家讀取存檔時自動呼叫此方法。
   */
  const _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    // 還原成就狀態（若為舊版存檔沒有此欄位，給予空陣列作為預設值）
    AchievementManager.loadSaveData(contents.achievementData || []);
  };

  /**
   * setupNewGame：新遊戲開始時重置所有成就。
   * 確保玩家重新開始遊戲時，成就狀態不殘留。
   */
  const _DataManager_setupNewGame = DataManager.setupNewGame;
  DataManager.setupNewGame = function() {
    _DataManager_setupNewGame.call(this);
    AchievementManager.initialize();
  };

  //===========================================================================
  // ■ Scene_Base 擴展 ─ 成就提示追蹤陣列初始化
  //===========================================================================

  /**
   * 在每個 Scene 建立時，初始化 _achievementToasts 陣列。
   * 這是防禦性措施，確保在任何 Scene（地圖、戰鬥等）中
   * AchievementManager._showToast 都能正常運作。
   *
   * 注意：即使沒有這個 hook，_showToast 內部也有防禦性的 if (!scene._achievementToasts) 初始化，
   *       此處僅為更明確地在 Scene 建立時就準備好陣列。
   */
  const _Scene_Base_create = Scene_Base.prototype.create;
  Scene_Base.prototype.create = function() {
    _Scene_Base_create.call(this);
    // 為每個新建的 Scene 建立乾淨的成就提示追蹤陣列
    this._achievementToasts = [];
  };

  //===========================================================================
  // ■ 插件載入完成通知（主控台）
  //===========================================================================

  console.log(
    `%c[KateAchievementSystem] v1.0 已載入。` +
    `共讀取 ${AchievementManager._database.size} 筆成就資料。`,
    'color: #4fc3f7; font-weight: bold;'
  );

})(); // End of IIFE
