//=============================================================================
// RPG Maker MZ - 進階以物易物 / 合成商店 (Advanced Barter & Crafting Shop)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.1.0] 多對一以物易物商店 - 使用多種素材合成兌換一個目標物品（不消耗金錢）
 * @author Claude
 * @url
 *
 * @help AdvancedBarterShop.js
 *
 * ============================================================================
 * 插件說明
 * ============================================================================
 * 本插件提供進階的「以物易物 / 合成」商店介面，玩家可以使用身上的
 * 多種素材（道具、武器、防具）來兌換另一個物品。
 *
 * 例如：10 個肉 + 5 個稻草 = 3 碗粥。
 *
 * 整個交易過程不消耗金幣（Gold），且不會覆蓋預設的 Scene_Shop，
 * 因此可以與其他商店類插件並存。
 *
 * ----------------------------------------------------------------------------
 * v1.1.0 變更
 * ----------------------------------------------------------------------------
 * - UI 佈局重構：底部新增獨立的標準說明視窗（Window_Help），顯示目標
 *   物品的 description。
 * - 右側視窗改名為 Window_BarterRequirement，僅顯示所需素材，不再
 *   重複顯示物品說明，也移除「最多可兌換」這一行。
 * - 修正取消鍵無法退出場景的問題（cancel handler 正確綁定 popScene）。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在插件參數「兌換配方列表」中設定每一筆配方：
 *    - 設定獲得物品（類型、ID、數量）
 *    - 設定多筆需求素材（每筆素材的類型、ID、數量）
 *
 * 2. 在事件中使用插件指令「開啟以物易物商店」即可開啟商店。
 *    - 若不指定配方 ID，則顯示全部配方
 *    - 若指定（例如 1,3,5），則只顯示對應的配方
 *
 * ============================================================================
 * 授權
 * ============================================================================
 * 可自由用於商業或非商業專案。
 *
 *
 * @param recipes
 * @text 兌換配方列表
 * @desc 設定所有可用的兌換配方（每筆配方可包含多種素材）
 * @type struct<Recipe>[]
 * @default []
 *
 *
 * @command OpenBarterShop
 * @text 開啟以物易物商店
 * @desc 開啟進階的多對一以物易物商店介面
 *
 * @arg recipeIds
 * @text 配方 ID 列表
 * @desc 要顯示的配方 ID（從 1 開始計算），留空則顯示所有配方。例如：[1,3,5]
 * @type number[]
 * @default []
 *
 */

/*~struct~Recipe:
 *
 * @param gainType
 * @text 獲得物品類型
 * @desc 玩家將獲得的物品類型
 * @type select
 * @option 道具 (Item)
 * @value item
 * @option 武器 (Weapon)
 * @value weapon
 * @option 防具 (Armor)
 * @value armor
 * @default item
 *
 * @param gainId
 * @text 獲得物品 ID
 * @desc 玩家將獲得的物品在資料庫中的 ID
 * @type number
 * @min 1
 * @default 1
 *
 * @param gainAmount
 * @text 獲得物品數量
 * @desc 一次兌換可獲得的物品數量
 * @type number
 * @min 1
 * @default 1
 *
 * @param costs
 * @text 需求素材列表
 * @desc 此配方所需的所有素材（可設定多筆）
 * @type struct<Cost>[]
 * @default []
 *
 */

/*~struct~Cost:
 *
 * @param type
 * @text 需求素材類型
 * @desc 素材的類型
 * @type select
 * @option 道具 (Item)
 * @value item
 * @option 武器 (Weapon)
 * @value weapon
 * @option 防具 (Armor)
 * @value armor
 * @default item
 *
 * @param id
 * @text 需求素材 ID
 * @desc 素材在資料庫中的 ID
 * @type number
 * @min 1
 * @default 1
 *
 * @param amount
 * @text 需求素材數量
 * @desc 單次兌換所需的素材數量
 * @type number
 * @min 1
 * @default 1
 *
 */

(() => {
    'use strict';

    //=========================================================================
    // 插件基本資訊
    //=========================================================================
    const PLUGIN_NAME = "AdvancedBarterShop";
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    //=========================================================================
    // 工具函式
    //=========================================================================
    /**
     * 安全 JSON 解析（避免空字串或損壞參數導致整個插件報錯）
     */
    const safeJsonParse = (jsonStr, fallback = null) => {
        if (jsonStr === undefined || jsonStr === null || jsonStr === "") {
            return fallback;
        }
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error(`[${PLUGIN_NAME}] JSON 解析失敗：`, jsonStr, e);
            return fallback;
        }
    };

    /**
     * 解析「單一需求素材」
     * MZ 的 struct 在參數陣列中以 JSON 字串形式儲存，需要二次解析
     */
    const parseCost = (costStr) => {
        const data = safeJsonParse(costStr);
        if (!data) return null;
        return {
            type: String(data.type || "item"),
            id: Number(data.id || 1),
            amount: Number(data.amount || 1)
        };
    };

    /**
     * 解析「單一兌換配方」
     */
    const parseRecipe = (recipeStr) => {
        const data = safeJsonParse(recipeStr);
        if (!data) return null;

        // costs 是「字串陣列」，每個元素還要再 parse 一次
        const rawCosts = safeJsonParse(data.costs || "[]", []);
        const costs = rawCosts.map(parseCost).filter(c => c !== null);

        return {
            gainType: String(data.gainType || "item"),
            gainId: Number(data.gainId || 1),
            gainAmount: Number(data.gainAmount || 1),
            costs: costs
        };
    };

    /**
     * 全域配方資料（插件啟動時一次解析完成）
     */
    const ALL_RECIPES = (() => {
        const rawArr = safeJsonParse(parameters["recipes"] || "[]", []);
        return rawArr.map(parseRecipe).filter(r => r !== null);
    })();

    /**
     * 依「類型 + ID」取得資料庫物品
     */
    const getDataItem = (type, id) => {
        switch (type) {
            case "item":   return $dataItems[id]   || null;
            case "weapon": return $dataWeapons[id] || null;
            case "armor":  return $dataArmors[id]  || null;
            default:       return null;
        }
    };

    /**
     * 計算「該配方最多可以兌換幾次」
     * 規則：對每一個素材計算 floor(擁有 / 需求)，再取所有結果的最小值
     * 注意：此函式仍然被保留，但只在「數量選擇視窗」啟動時使用，
     *       不再於右側詳細視窗中直接顯示給玩家。
     */
    const calcMaxCraft = (recipe) => {
        if (!recipe || !recipe.costs || recipe.costs.length === 0) return 0;
        let maxCraft = Infinity;
        for (const cost of recipe.costs) {
            const item = getDataItem(cost.type, cost.id);
            if (!item) return 0;
            if (cost.amount <= 0) continue;   // 防呆，避免除以 0
            const owned = $gameParty.numItems(item);
            const possible = Math.floor(owned / cost.amount);
            if (possible < maxCraft) maxCraft = possible;
        }
        return maxCraft === Infinity ? 0 : maxCraft;
    };

    /**
     * 判斷配方是否「至少可兌換 1 次」
     */
    const canCraftOnce = (recipe) => calcMaxCraft(recipe) >= 1;

    //=========================================================================
    // 插件指令註冊
    //=========================================================================
    PluginManager.registerCommand(PLUGIN_NAME, "OpenBarterShop", function(args) {
        // 解析配方 ID 陣列
        let recipeIds = [];
        try {
            recipeIds = JSON.parse(args.recipeIds || "[]").map(Number);
        } catch (e) {
            recipeIds = [];
        }

        // 依 ID（1-based）篩選配方；若未指定則使用所有配方
        let recipes;
        if (recipeIds.length > 0) {
            recipes = recipeIds
                .map(id => ALL_RECIPES[id - 1])
                .filter(r => r);
        } else {
            recipes = ALL_RECIPES.slice();
        }

        SceneManager.push(Scene_BarterShop);
        SceneManager.prepareNextScene(recipes);
    });

    //=========================================================================
    // Scene_BarterShop（場景主類）
    //=========================================================================
    /**
     * 視窗佈局（v1.1.0）：
     *
     *  +-----------------+-----------------+
     *  |                 |   Gold Window   |
     *  +-----------------+-----------------+
     *  |                 |                 |
     *  |  Window_        |  Window_        |
     *  |   BarterList    |   Barter        |
     *  |  (左：可兌換)   |   Requirement   |
     *  |                 |  (右：只顯示素材)|
     *  |                 |                 |
     *  +-----------------+-----------------+
     *  |  Window_Help (底部：目標物品說明)   |
     *  +-------------------------------------+
     */
    class Scene_BarterShop extends Scene_MenuBase {

        /**
         * 由 SceneManager.prepareNextScene 注入配方資料
         */
        prepare(recipes) {
            this._recipes = recipes || [];
        }

        create() {
            super.create();
            // 注意建立順序：先金錢視窗（決定上方高度），
            // 再幫助視窗（決定下方高度），最後才是中段的左右視窗
            this.createGoldWindow();
            this.createHelpWindow();
            this.createCommandWindow();
            this.createRequirementWindow();
            this.createNumberWindow();
        }

        // ------------------------------------------------------------------
        // 上方金錢視窗（資訊性顯示，實際交易不會消耗金錢）
        // ------------------------------------------------------------------
        createGoldWindow() {
            const rect = this.goldWindowRect();
            this._goldWindow = new Window_Gold(rect);
            this.addWindow(this._goldWindow);
        }

        goldWindowRect() {
            const ww = this.mainCommandWidth();
            const wh = this.calcWindowHeight(1, true);
            const wx = Graphics.boxWidth - ww;
            const wy = this.mainAreaTop();
            return new Rectangle(wx, wy, ww, wh);
        }

        // ------------------------------------------------------------------
        // 底部說明視窗（標準 Window_Help，顯示目標物品的 description）
        // ------------------------------------------------------------------
        /**
         * 覆寫 Scene_MenuBase.createHelpWindow，將 Help 視窗放在「底部」。
         * 預設行為是放在頂部；我們要它跟標準商店一樣在下方。
         */
        createHelpWindow() {
            const rect = this.helpWindowRect();
            this._helpWindow = new Window_Help(rect);
            this.addWindow(this._helpWindow);
        }

        /**
         * 底部 Help 視窗的位置：靠下，寬度撐滿整個畫面
         */
        helpWindowRect() {
            const wx = 0;
            const wh = this.calcWindowHeight(2, false);
            const wy = Graphics.boxHeight - wh;
            const ww = Graphics.boxWidth;
            return new Rectangle(wx, wy, ww, wh);
        }

        // ------------------------------------------------------------------
        // 左側：可兌換配方列表
        // ------------------------------------------------------------------
        createCommandWindow() {
            const rect = this.commandWindowRect();
            this._commandWindow = new Window_BarterList(rect);
            this._commandWindow.setRecipes(this._recipes);

            // 綁定 helpWindow，讓選擇變更時自動更新底部說明
            this._commandWindow.setHelpWindow(this._helpWindow);

            // 重點修正：確保 cancel handler 正確綁定 popScene
            // 玩家按 ESC / X / 滑鼠右鍵時會觸發此處
            this._commandWindow.setHandler("ok",     this.onItemOk.bind(this));
            this._commandWindow.setHandler("cancel", this.popScene.bind(this));

            this.addWindow(this._commandWindow);
            this._commandWindow.activate();
            this._commandWindow.select(0);
        }

        commandWindowRect() {
            const wx = 0;
            const wy = this._goldWindow.y + this._goldWindow.height;
            const ww = Math.floor(Graphics.boxWidth / 2);
            // 中段高度 = 整個 main area - 金錢視窗高 - 底部 Help 視窗高
            const wh = this.mainAreaHeight()
                     - this._goldWindow.height
                     - this._helpWindow.height;
            return new Rectangle(wx, wy, ww, wh);
        }

        // ------------------------------------------------------------------
        // 右側：所需素材視窗（不再顯示說明文字）
        // ------------------------------------------------------------------
        createRequirementWindow() {
            const rect = this.requirementWindowRect();
            this._requirementWindow = new Window_BarterRequirement(rect);
            this.addWindow(this._requirementWindow);

            // 讓左側列表在選擇變動時通知右側視窗刷新
            this._commandWindow.setRequirementWindow(this._requirementWindow);
        }

        requirementWindowRect() {
            const wx = this._commandWindow.width;
            const wy = this._commandWindow.y;
            const ww = Graphics.boxWidth - this._commandWindow.width;
            const wh = this._commandWindow.height;
            return new Rectangle(wx, wy, ww, wh);
        }

        // ------------------------------------------------------------------
        // 數量選擇視窗（彈出，覆蓋右側區域）
        // ------------------------------------------------------------------
        createNumberWindow() {
            const rect = this.numberWindowRect();
            this._numberWindow = new Window_BarterNumber(rect);
            this._numberWindow.hide();
            this._numberWindow.setHandler("ok",     this.onNumberOk.bind(this));
            this._numberWindow.setHandler("cancel", this.onNumberCancel.bind(this));
            this.addWindow(this._numberWindow);
        }

        numberWindowRect() {
            return new Rectangle(
                this._requirementWindow.x,
                this._requirementWindow.y,
                this._requirementWindow.width,
                this._requirementWindow.height
            );
        }

        // ------------------------------------------------------------------
        // Handlers
        // ------------------------------------------------------------------
        /**
         * 在左側列表按下確認 -> 進入數量選擇
         */
        onItemOk() {
            const recipe = this._commandWindow.currentRecipe();
            if (!recipe) {
                this._commandWindow.activate();
                return;
            }
            // 精準計算最大可兌換次數（所有素材 floor(擁有/需求) 的最小值）
            // 注意：這就是「不在右側預先顯示」的最大值計算，
            //       僅供數量視窗作為上限使用。
            const max = calcMaxCraft(recipe);
            this._numberWindow.setup(recipe, max);
            this._requirementWindow.hide();
            this._numberWindow.show();
            this._numberWindow.activate();
        }

        /**
         * 數量視窗確認 -> 執行兌換
         */
        onNumberOk() {
            SoundManager.playShop();
            this.doBarter(this._numberWindow.recipe(), this._numberWindow.number());
            this._numberWindow.hide();
            this._requirementWindow.show();

            // 重新整理所有視窗，反映新的物品數量
            this._commandWindow.refresh();
            this._requirementWindow.refresh();
            this._goldWindow.refresh();

            this._commandWindow.activate();
        }

        /**
         * 數量視窗取消 -> 回到左側列表
         */
        onNumberCancel() {
            SoundManager.playCancel();
            this._numberWindow.hide();
            this._requirementWindow.show();
            this._commandWindow.activate();
        }

        /**
         * 執行兌換邏輯：扣除多種素材、給予獲得物品
         */
        doBarter(recipe, count) {
            if (!recipe || count <= 0) return;
            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!gainItem) return;

            // 扣除所有素材（第二參數 false：不從裝備扣）
            for (const cost of recipe.costs) {
                const costItem = getDataItem(cost.type, cost.id);
                if (!costItem) continue;
                $gameParty.loseItem(costItem, cost.amount * count, false);
            }
            // 給予獲得物品
            $gameParty.gainItem(gainItem, recipe.gainAmount * count, false);
        }
    }

    //=========================================================================
    // Window_BarterList（左側：配方列表）
    //=========================================================================
    class Window_BarterList extends Window_Selectable {

        initialize(rect) {
            super.initialize(rect);
            this._recipes = [];
            this._requirementWindow = null;
        }

        setRecipes(recipes) {
            this._recipes = recipes || [];
            this.refresh();
            this.select(0);
        }

        /**
         * 注入右側素材視窗，使其能在選擇變動時同步刷新
         */
        setRequirementWindow(requirementWindow) {
            this._requirementWindow = requirementWindow;
            this.callUpdateHelp();
        }

        maxItems() {
            return this._recipes ? this._recipes.length : 0;
        }

        currentRecipe() {
            return this._recipes[this.index()];
        }

        currentGainItem() {
            const recipe = this.currentRecipe();
            if (!recipe) return null;
            return getDataItem(recipe.gainType, recipe.gainId);
        }

        /**
         * 是否可兌換：遍歷所有素材，任一不足則 false
         */
        isRecipeEnabled(recipe) {
            if (!recipe) return false;
            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!gainItem) return false;
            if (!recipe.costs || recipe.costs.length === 0) return false;
            return canCraftOnce(recipe);
        }

        /**
         * MZ 會用此方法判斷「目前項目能否確認」
         * 不可用時按 OK 會自動播放 buzzer 音
         */
        isCurrentItemEnabled() {
            return this.isRecipeEnabled(this.currentRecipe());
        }

        /**
         * 繪製單一項目（圖示 + 名稱 + 獲得數量）
         */
        drawItem(index) {
            const recipe = this._recipes[index];
            if (!recipe) return;
            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!gainItem) return;

            const rect = this.itemLineRect(index);
            const enabled = this.isRecipeEnabled(recipe);

            // 灰階：不可兌換時降低不透明度
            this.changePaintOpacity(enabled);

            // 名稱（含圖示）
            this.drawItemName(gainItem, rect.x, rect.y, rect.width - 80);

            // 右側：獲得數量
            this.drawText(`×${recipe.gainAmount}`, rect.x, rect.y, rect.width, "right");

            // 恢復畫筆不透明度
            this.changePaintOpacity(true);
        }

        /**
         * 選擇變更時：同步刷新底部說明視窗 + 右側素材視窗
         */
        callUpdateHelp() {
            super.callUpdateHelp();
            // 底部 Help：顯示目標物品的 description
            if (this._helpWindow) {
                this._helpWindow.setItem(this.currentGainItem());
            }
            // 右側素材視窗：列出所需素材
            if (this._requirementWindow) {
                this._requirementWindow.setRecipe(this.currentRecipe());
            }
        }
    }

    //=========================================================================
    // Window_BarterRequirement（右側：所需素材視窗）
    //
    // v1.1.0 重點：
    //   - 不再顯示目標物品的 description（避免與底部 Help 重複）
    //   - 不再顯示「最多可兌換」這一行
    //   - 僅專注於：標題列 + 所需素材逐行列表（圖示 + 名稱 + 擁有/需求）
    //=========================================================================
    class Window_BarterRequirement extends Window_Base {

        initialize(rect) {
            super.initialize(rect);
            this._recipe = null;
            this.refresh();
        }

        setRecipe(recipe) {
            if (this._recipe === recipe) return;
            this._recipe = recipe;
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            const recipe = this._recipe;
            if (!recipe) return;

            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!gainItem) return;

            const lineHeight = this.lineHeight();
            let y = 0;

            // === 區塊一：獲得物品（一行） ===
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("獲得物品", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            y += lineHeight;

            this.drawItemName(gainItem, 0, y, this.innerWidth - 80);
            this.drawText(`×${recipe.gainAmount}`, 0, y, this.innerWidth, "right");
            y += lineHeight + Math.floor(lineHeight / 4);

            // === 區塊二：所需材料（逐行） ===
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("所需材料", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            y += lineHeight;

            if (recipe.costs && recipe.costs.length > 0) {
                for (const cost of recipe.costs) {
                    // 視窗高度若不夠則停止繪製，避免超出
                    if (y + lineHeight > this.innerHeight) break;
                    y = this.drawCostLine(cost, y);
                }
            } else {
                this.drawText("（無）", 0, y, this.innerWidth, "left");
            }

            // 注意：依照 v1.1.0 規範，這裡「不再顯示」：
            //   - 最多可兌換 N 次
            //   - 物品說明（description）
            // 物品說明改由底部獨立的 Window_Help 處理。
        }

        /**
         * 繪製單一素材列：圖示 + 名稱 + (擁有 / 需求)
         * 不足時擁有數使用警告色
         */
        drawCostLine(cost, y) {
            const lineHeight = this.lineHeight();
            const item = getDataItem(cost.type, cost.id);
            if (!item) {
                this.drawText("（資料錯誤）", 0, y, this.innerWidth, "left");
                return y + lineHeight;
            }

            const owned = $gameParty.numItems(item);
            const need = cost.amount;
            const enough = owned >= need;

            // 左：圖示 + 名稱
            this.drawItemName(item, 0, y, this.innerWidth - 160);

            // 右：擁有 / 需求（不足時警告色）
            if (!enough) {
                this.changeTextColor(ColorManager.crisisColor());
            } else {
                this.resetTextColor();
            }
            const text = `${owned} / ${need}`;
            this.drawText(text, 0, y, this.innerWidth, "right");
            this.resetTextColor();

            return y + lineHeight;
        }
    }

    //=========================================================================
    // Window_BarterNumber（彈出：數量輸入）
    //
    // 此處仍保留「最大值」的使用：
    //   - max 是由 calcMaxCraft(recipe) 計算後傳入
    //   - 玩家只能在 1 ~ max 之間調整
    //=========================================================================
    class Window_BarterNumber extends Window_Selectable {

        initialize(rect) {
            super.initialize(rect);
            this._recipe = null;
            this._max = 1;
            this._number = 1;
            this.createButtons();
        }

        /**
         * 啟動本次輸入
         * @param {Object} recipe - 兌換配方
         * @param {number} max    - 最大可兌換次數（由場景端 calcMaxCraft 計算）
         */
        setup(recipe, max) {
            this._recipe = recipe;
            this._max = Math.max(1, max);
            this._number = 1;
            this.placeButtons();
            this.refresh();
        }

        recipe() { return this._recipe; }
        number() { return this._number; }
        maxItems() { return 1; }

        // ---- 觸控按鈕 ----
        createButtons() {
            this._buttons = [];
            if (ConfigManager.touchUI) {
                for (const type of ["down2", "down", "up", "up2", "ok"]) {
                    const button = new Sprite_Button(type);
                    this._buttons.push(button);
                    this.addInnerChild(button);
                }
                this._buttons[0].setClickHandler(this.onButtonDown2.bind(this));
                this._buttons[1].setClickHandler(this.onButtonDown.bind(this));
                this._buttons[2].setClickHandler(this.onButtonUp.bind(this));
                this._buttons[3].setClickHandler(this.onButtonUp2.bind(this));
                this._buttons[4].setClickHandler(this.onButtonOk.bind(this));
            }
        }

        placeButtons() {
            const sp = this.buttonSpacing();
            const totalWidth = this.totalButtonWidth();
            let x = (this.innerWidth - totalWidth) / 2;
            for (const button of this._buttons) {
                button.x = x;
                button.y = this.buttonY();
                x += button.width + sp;
            }
        }

        buttonSpacing() { return 8; }

        totalButtonWidth() {
            const sp = this.buttonSpacing();
            return this._buttons.reduce((r, b) => r + b.width + sp, -sp);
        }

        buttonY() {
            return Math.floor(this.innerHeight - this.lineHeight() * 1.5);
        }

        // ---- 輸入處理 ----
        update() {
            super.update();
            this.processNumberChange();
        }

        processNumberChange() {
            if (this.isOpenAndActive()) {
                if (Input.isRepeated("right")) this.changeNumber(1);
                if (Input.isRepeated("left"))  this.changeNumber(-1);
                if (Input.isRepeated("up"))    this.changeNumber(10);
                if (Input.isRepeated("down"))  this.changeNumber(-10);
            }
        }

        changeNumber(amount) {
            const last = this._number;
            this._number = (this._number + amount).clamp(1, this._max);
            if (this._number !== last) {
                this.playCursorSound();
                this.refresh();
            }
        }

        // ---- 繪製 ----
        refresh() {
            this.contents.clear();
            const recipe = this._recipe;
            if (!recipe) return;

            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!gainItem) return;

            const lineHeight = this.lineHeight();
            let y = 0;

            // 標題
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("選擇兌換次數", 0, y, this.innerWidth, "center");
            this.resetTextColor();
            y += lineHeight + 4;

            // 獲得物品（顯示本次總獲得數量）
            this.drawItemName(gainItem, 0, y, this.innerWidth - 100);
            const gainTotal = recipe.gainAmount * this._number;
            this.drawText(`×${gainTotal}`, 0, y, this.innerWidth, "right");
            y += lineHeight + 4;

            // 消耗素材區塊
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("消耗素材", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            y += lineHeight;

            for (const cost of recipe.costs) {
                if (y + lineHeight > this.buttonY() - lineHeight * 2) break;
                const costItem = getDataItem(cost.type, cost.id);
                if (!costItem) continue;
                const owned = $gameParty.numItems(costItem);
                const totalNeed = cost.amount * this._number;

                this.drawItemName(costItem, 0, y, this.innerWidth - 160);

                // 本次消耗 / 擁有
                this.resetTextColor();
                this.drawText(`${totalNeed} / ${owned}`, 0, y, this.innerWidth, "right");
                y += lineHeight;
            }

            // 中央放大顯示目前數量（含最大值提示）
            y += Math.floor(lineHeight / 2);
            const numberY = Math.max(y, this.buttonY() - lineHeight * 2);
            this.drawCurrentNumber(numberY);
        }

        drawCurrentNumber(y) {
            this.contents.fontSize = $gameSystem.mainFontSize() + 10;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("數量", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            const numberText = `× ${this._number}  (最多 ${this._max})`;
            this.drawText(numberText, 0, y, this.innerWidth, "right");
            this.contents.fontSize = $gameSystem.mainFontSize();
        }

        // ---- 按鈕回呼 ----
        onButtonUp()    { this.changeNumber(1);   }
        onButtonUp2()   { this.changeNumber(10);  }
        onButtonDown()  { this.changeNumber(-1);  }
        onButtonDown2() { this.changeNumber(-10); }
        onButtonOk()    { this.processOk();       }
    }

    //=========================================================================
    // 暴露至全域，便於其他插件繼承擴充
    //=========================================================================
    window.Scene_BarterShop          = Scene_BarterShop;
    window.Window_BarterList         = Window_BarterList;
    window.Window_BarterRequirement  = Window_BarterRequirement;
    window.Window_BarterNumber       = Window_BarterNumber;

})();
