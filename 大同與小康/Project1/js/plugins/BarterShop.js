//=============================================================================
// RPG Maker MZ - 以物易物商店 (Barter Shop)
//=============================================================================
/*:
 * @target MZ
 * @plugindesc [v1.0.0] 以物易物商店系統 - 使用道具/武器/防具來兌換其他物品（不消耗金錢）
 * @author Claude
 * @url 
 *
 * @help BarterShop.js
 *
 * ============================================================================
 * 插件說明
 * ============================================================================
 * 本插件提供一個全新的「以物易物」商店介面，玩家可以使用身上的指定物品
 * （道具、武器、防具）來兌換另一個物品，整個交易過程不消耗金幣。
 *
 * 此插件不會覆蓋預設的 Scene_Shop，因此可以與其他商店插件並存。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在插件參數中設定「兌換配方（Recipes）」，每個配方包含：
 *    - 獲得物品（類型、ID、數量）
 *    - 需求物品（類型、ID、數量）
 *
 * 2. 在事件中使用插件指令「開啟以物易物商店」即可開啟商店。
 *    若不指定配方 ID 列表，則顯示所有配方；
 *    若指定（例如 1,3,5），則只顯示對應的配方。
 *
 * ============================================================================
 * 授權條款
 * ============================================================================
 * 可自由使用於商業或非商業專案。
 *
 *
 * @param recipes
 * @text 兌換配方列表
 * @desc 設定所有可用的兌換配方（每個配方代表一筆可進行的以物易物交易）
 * @type struct<Recipe>[]
 * @default []
 *
 *
 * @command OpenBarterShop
 * @text 開啟以物易物商店
 * @desc 開啟以物易物商店介面
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
 * @desc 玩家將獲得的物品 ID（在資料庫中的 ID）
 * @type number
 * @min 1
 * @default 1
 *
 * @param gainAmount
 * @text 獲得物品數量
 * @desc 一次交易玩家獲得的物品數量
 * @type number
 * @min 1
 * @default 1
 *
 * @param costType
 * @text 需求物品類型
 * @desc 兌換所需的物品類型
 * @type select
 * @option 道具 (Item)
 * @value item
 * @option 武器 (Weapon)
 * @value weapon
 * @option 防具 (Armor)
 * @value armor
 * @default item
 *
 * @param costId
 * @text 需求物品 ID
 * @desc 兌換所需的物品 ID（在資料庫中的 ID）
 * @type number
 * @min 1
 * @default 1
 *
 * @param costAmount
 * @text 需求物品數量
 * @desc 一次交易所需消耗的物品數量
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
    const PLUGIN_NAME = "BarterShop";
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    //=========================================================================
    // 工具函式：解析插件參數中的配方
    //=========================================================================
    /**
     * 將 JSON 字串安全地解析為物件
     * @param {string} jsonStr - JSON 格式字串
     * @returns {Object|null}
     */
    const safeJsonParse = (jsonStr) => {
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error(`[${PLUGIN_NAME}] JSON 解析失敗：`, jsonStr, e);
            return null;
        }
    };

    /**
     * 解析單一配方資料
     * @param {string} recipeStr - 配方 JSON 字串
     * @returns {Object|null} 解析後的配方物件
     */
    const parseRecipe = (recipeStr) => {
        const data = safeJsonParse(recipeStr);
        if (!data) return null;
        return {
            gainType: String(data.gainType || "item"),
            gainId: Number(data.gainId || 1),
            gainAmount: Number(data.gainAmount || 1),
            costType: String(data.costType || "item"),
            costId: Number(data.costId || 1),
            costAmount: Number(data.costAmount || 1)
        };
    };

    /**
     * 解析插件參數中的所有配方
     */
    const ALL_RECIPES = (() => {
        const rawArr = safeJsonParse(parameters["recipes"] || "[]") || [];
        return rawArr.map(parseRecipe).filter(r => r !== null);
    })();

    /**
     * 依據類型與 ID 取得對應的資料庫物件
     * @param {string} type - "item" / "weapon" / "armor"
     * @param {number} id - 物品 ID
     * @returns {Object|null} 物品資料
     */
    const getDataItem = (type, id) => {
        switch (type) {
            case "item":   return $dataItems[id]   || null;
            case "weapon": return $dataWeapons[id] || null;
            case "armor":  return $dataArmors[id]  || null;
            default:       return null;
        }
    };

    //=========================================================================
    // 插件指令註冊
    //=========================================================================
    PluginManager.registerCommand(PLUGIN_NAME, "OpenBarterShop", function(args) {
        // 解析配方 ID 列表參數
        let recipeIds = [];
        try {
            recipeIds = JSON.parse(args.recipeIds || "[]").map(Number);
        } catch (e) {
            recipeIds = [];
        }

        // 若指定了配方 ID，則只取出對應配方（ID 從 1 開始，對應索引 - 1）
        // 若未指定，則使用全部配方
        let recipes;
        if (recipeIds.length > 0) {
            recipes = recipeIds
                .map(id => ALL_RECIPES[id - 1])
                .filter(r => r);
        } else {
            recipes = ALL_RECIPES.slice();
        }

        // 將要使用的配方暫存於 SceneManager，供 Scene_BarterShop 取用
        SceneManager.push(Scene_BarterShop);
        SceneManager.prepareNextScene(recipes);
    });

    //=========================================================================
    // Scene_BarterShop（以物易物商店場景）
    //=========================================================================
    /**
     * 繼承自 Scene_MenuBase 的以物易物商店場景
     */
    class Scene_BarterShop extends Scene_MenuBase {

        /**
         * 預先準備場景所需資料（由 SceneManager.prepareNextScene 注入）
         * @param {Array} recipes - 要顯示的配方陣列
         */
        prepare(recipes) {
            this._recipes = recipes || [];
        }

        /**
         * 初始化建立場景
         */
        create() {
            super.create();
            this.createHelpWindow();      // 上方說明視窗
            this.createGoldWindow();      // （右上）金錢視窗 - 可選顯示
            this.createCommandWindow();   // 左側配方列表
            this.createStatusWindow();    // 右側材料需求視窗
            this.createNumberWindow();    // 數量輸入視窗
        }

        /**
         * 建立金錢視窗（顯示在右上角，便於玩家了解自身狀態，但實際交易不消耗金錢）
         */
        createGoldWindow() {
            const rect = this.goldWindowRect();
            this._goldWindow = new Window_Gold(rect);
            this.addWindow(this._goldWindow);
        }

        /**
         * 計算金錢視窗的位置
         */
        goldWindowRect() {
            const ww = this.mainCommandWidth();
            const wh = this.calcWindowHeight(1, true);
            const wx = Graphics.boxWidth - ww;
            const wy = this.mainAreaTop();
            return new Rectangle(wx, wy, ww, wh);
        }

        /**
         * 建立左側配方列表（玩家可從這裡選擇要兌換的物品）
         */
        createCommandWindow() {
            const rect = this.commandWindowRect();
            this._commandWindow = new Window_BarterList(rect);
            this._commandWindow.setRecipes(this._recipes);
            this._commandWindow.setHelpWindow(this._helpWindow);
            this._commandWindow.setHandler("ok", this.onItemOk.bind(this));
            this._commandWindow.setHandler("cancel", this.popScene.bind(this));
            this.addWindow(this._commandWindow);
        }

        /**
         * 計算左側配方視窗的位置與尺寸
         */
        commandWindowRect() {
            const wx = 0;
            const wy = this._goldWindow.y + this._goldWindow.height;
            const ww = Math.floor(Graphics.boxWidth / 2);
            const wh = this.mainAreaHeight() - this._goldWindow.height;
            return new Rectangle(wx, wy, ww, wh);
        }

        /**
         * 建立右側材料需求視窗
         */
        createStatusWindow() {
            const rect = this.statusWindowRect();
            this._statusWindow = new Window_BarterStatus(rect);
            this.addWindow(this._statusWindow);
            this._commandWindow.setStatusWindow(this._statusWindow);
        }

        /**
         * 計算右側狀態視窗的位置與尺寸
         */
        statusWindowRect() {
            const ww = Graphics.boxWidth - this._commandWindow.width;
            const wh = this._commandWindow.height;
            const wx = this._commandWindow.width;
            const wy = this._commandWindow.y;
            return new Rectangle(wx, wy, ww, wh);
        }

        /**
         * 建立數量輸入視窗（彈出於畫面中央）
         */
        createNumberWindow() {
            const rect = this.numberWindowRect();
            this._numberWindow = new Window_BarterNumber(rect);
            this._numberWindow.hide();
            this._numberWindow.setHandler("ok", this.onNumberOk.bind(this));
            this._numberWindow.setHandler("cancel", this.onNumberCancel.bind(this));
            this.addWindow(this._numberWindow);
        }

        /**
         * 計算數量輸入視窗位置（覆蓋狀態視窗的位置，產生彈出效果）
         */
        numberWindowRect() {
            const wx = this._statusWindow.x;
            const wy = this._statusWindow.y;
            const ww = this._statusWindow.width;
            const wh = this._statusWindow.height;
            return new Rectangle(wx, wy, ww, wh);
        }

        /**
         * 當玩家在配方列表中按下確認鍵
         */
        onItemOk() {
            const recipe = this._commandWindow.currentRecipe();
            if (!recipe) {
                this._commandWindow.activate();
                return;
            }
            // 計算最大兌換數量（取決於玩家擁有的材料數量）
            const costItem = getDataItem(recipe.costType, recipe.costId);
            const owned = $gameParty.numItems(costItem);
            const max = Math.floor(owned / recipe.costAmount);

            // 設定數量視窗
            this._numberWindow.setup(recipe, max);
            this._numberWindow.setCurrencyUnit("");
            this._numberWindow.show();
            this._numberWindow.activate();
        }

        /**
         * 當玩家在數量輸入視窗按下確認鍵（執行兌換）
         */
        onNumberOk() {
            SoundManager.playShop();
            this.doBarter(this._numberWindow.recipe(), this._numberWindow.number());
            this._numberWindow.hide();
            this._commandWindow.refresh();
            this._statusWindow.refresh();
            this._goldWindow.refresh();
            this._commandWindow.activate();
        }

        /**
         * 當玩家在數量輸入視窗取消
         */
        onNumberCancel() {
            SoundManager.playCancel();
            this._numberWindow.hide();
            this._commandWindow.activate();
        }

        /**
         * 執行實際兌換邏輯：扣除材料、給予物品
         * @param {Object} recipe - 兌換配方
         * @param {number} count - 兌換次數
         */
        doBarter(recipe, count) {
            if (!recipe || count <= 0) return;
            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            const costItem = getDataItem(recipe.costType, recipe.costId);
            if (!gainItem || !costItem) return;

            // 扣除消耗材料（注意：第二參數 false 表示不包含裝備中的物品）
            $gameParty.loseItem(costItem, recipe.costAmount * count, false);
            // 給予獲得的物品
            $gameParty.gainItem(gainItem, recipe.gainAmount * count, false);
        }
    }

    //=========================================================================
    // Window_BarterList（左側：可兌換物品列表視窗）
    //=========================================================================
    /**
     * 繼承自 Window_Selectable，顯示所有可兌換的配方
     */
    class Window_BarterList extends Window_Selectable {

        initialize(rect) {
            super.initialize(rect);
            this._recipes = [];
            this._statusWindow = null;
        }

        /**
         * 設定配方列表
         * @param {Array} recipes - 配方陣列
         */
        setRecipes(recipes) {
            this._recipes = recipes || [];
            this.refresh();
            this.select(0);
        }

        /**
         * 設定狀態視窗（讓選擇改變時可同步更新右側視窗）
         */
        setStatusWindow(statusWindow) {
            this._statusWindow = statusWindow;
            this.callUpdateHelp();
        }

        /**
         * 列表項目總數
         */
        maxItems() {
            return this._recipes ? this._recipes.length : 0;
        }

        /**
         * 取得目前選中的配方
         */
        currentRecipe() {
            return this._recipes[this.index()];
        }

        /**
         * 取得選中配方對應的「獲得物品」資料
         */
        currentGainItem() {
            const recipe = this.currentRecipe();
            if (!recipe) return null;
            return getDataItem(recipe.gainType, recipe.gainId);
        }

        /**
         * 判斷配方是否可兌換（材料是否足夠）
         */
        isRecipeEnabled(recipe) {
            if (!recipe) return false;
            const costItem = getDataItem(recipe.costType, recipe.costId);
            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!costItem || !gainItem) return false;
            return $gameParty.numItems(costItem) >= recipe.costAmount;
        }

        /**
         * 目前項目是否可點選（覆寫父類別方法，用於灰階顯示與防止點擊）
         */
        isCurrentItemEnabled() {
            return this.isRecipeEnabled(this.currentRecipe());
        }

        /**
         * 繪製單一項目
         * @param {number} index - 項目索引
         */
        drawItem(index) {
            const recipe = this._recipes[index];
            if (!recipe) return;
            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            if (!gainItem) return;

            const rect = this.itemLineRect(index);
            const enabled = this.isRecipeEnabled(recipe);

            // 根據是否可兌換調整透明度（半透明 = 灰色）
            this.changePaintOpacity(enabled);

            // 繪製圖標 + 名稱
            this.drawItemName(gainItem, rect.x, rect.y, rect.width - 60);

            // 在右側顯示「獲得數量」
            const amountText = `×${recipe.gainAmount}`;
            this.drawText(amountText, rect.x, rect.y, rect.width, "right");

            // 恢復畫筆不透明度
            this.changePaintOpacity(true);
        }

        /**
         * 當選擇改變時更新右側狀態視窗
         */
        callUpdateHelp() {
            super.callUpdateHelp();
            if (this._statusWindow) {
                this._statusWindow.setRecipe(this.currentRecipe());
            }
            // 同步更新 helpWindow 的說明文字
            if (this._helpWindow) {
                const gainItem = this.currentGainItem();
                this._helpWindow.setItem(gainItem);
            }
        }

        /**
         * 刷新顯示
         */
        refresh() {
            super.refresh();
        }
    }

    //=========================================================================
    // Window_BarterStatus（右側：所需材料顯示視窗）
    //=========================================================================
    /**
     * 繼承自 Window_Base，顯示選中物品所需的材料明細
     */
    class Window_BarterStatus extends Window_Base {

        initialize(rect) {
            super.initialize(rect);
            this._recipe = null;
            this.refresh();
        }

        /**
         * 設定目前顯示的配方
         */
        setRecipe(recipe) {
            if (this._recipe === recipe) return;
            this._recipe = recipe;
            this.refresh();
        }

        /**
         * 重新繪製視窗內容
         */
        refresh() {
            this.contents.clear();
            const recipe = this._recipe;
            if (!recipe) return;

            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            const costItem = getDataItem(recipe.costType, recipe.costId);
            if (!gainItem || !costItem) return;

            const lineHeight = this.lineHeight();
            const padding = 0;
            let y = padding;

            // === 區塊一：標題「獲得物品」 ===
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("獲得物品", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            y += lineHeight;

            // 顯示「獲得物品」名稱與數量
            this.drawItemName(gainItem, 0, y, this.innerWidth - 80);
            this.drawText(`×${recipe.gainAmount}`, 0, y, this.innerWidth, "right");
            y += lineHeight;

            // 空一行
            y += Math.floor(lineHeight / 2);

            // === 區塊二：標題「所需材料」 ===
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("所需材料", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            y += lineHeight;

            // 顯示「需求材料」名稱與數量（同時顯示玩家擁有多少）
            const owned = $gameParty.numItems(costItem);
            const needAmount = recipe.costAmount;
            const enough = owned >= needAmount;

            this.drawItemName(costItem, 0, y, this.innerWidth - 160);

            // 若材料不足，使用紅色（CrisisColor）顯示
            if (!enough) {
                this.changeTextColor(ColorManager.crisisColor());
            }
            const requireText = `${owned} / ${needAmount}`;
            this.drawText(requireText, 0, y, this.innerWidth, "right");
            this.resetTextColor();
            y += lineHeight;

            // === 區塊三：說明文字 ===
            y += Math.floor(lineHeight / 2);
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("說明", 0, y, this.innerWidth, "left");
            this.resetTextColor();
            y += lineHeight;

            // 繪製物品說明（多行）
            const description = gainItem.description || "";
            this.drawTextEx(description, 0, y, this.innerWidth);
        }
    }

    //=========================================================================
    // Window_BarterNumber（數量選擇視窗）
    //=========================================================================
    /**
     * 繼承自 Window_Selectable 的數量輸入視窗
     * 玩家可以調整本次要兌換的次數
     */
    class Window_BarterNumber extends Window_Selectable {

        initialize(rect) {
            super.initialize(rect);
            this._recipe = null;
            this._max = 1;
            this._number = 1;
            this._currencyUnit = "";
            this.createButtons();
        }

        /**
         * 設定本次兌換的配方與最大可兌換次數
         */
        setup(recipe, max) {
            this._recipe = recipe;
            this._max = Math.max(1, max);
            this._number = 1;
            this.placeButtons();
            this.refresh();
        }

        /**
         * 取得目前的配方
         */
        recipe() {
            return this._recipe;
        }

        /**
         * 取得目前輸入的數量
         */
        number() {
            return this._number;
        }

        /**
         * 設定貨幣單位（此處不會用到，但保留 API 一致性）
         */
        setCurrencyUnit(unit) {
            this._currencyUnit = unit;
        }

        /**
         * 建立 +/- 按鈕（觸控用）
         */
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

        /**
         * 排列 +/- 按鈕
         */
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

        /**
         * 按鈕間距
         */
        buttonSpacing() {
            return 8;
        }

        /**
         * 計算按鈕總寬度
         */
        totalButtonWidth() {
            const sp = this.buttonSpacing();
            return this._buttons.reduce((r, b) => r + b.width + sp, -sp);
        }

        /**
         * 按鈕 Y 位置
         */
        buttonY() {
            return Math.floor(this.itemY() + this.itemHeight() + this.lineHeight() * 0.5);
        }

        /**
         * 顯示視窗時，啟動按鈕
         */
        update() {
            super.update();
            this.processNumberChange();
        }

        /**
         * 處理數量增減的輸入
         */
        processNumberChange() {
            if (this.isOpenAndActive()) {
                if (Input.isRepeated("right")) {
                    this.changeNumber(1);
                }
                if (Input.isRepeated("left")) {
                    this.changeNumber(-1);
                }
                if (Input.isRepeated("up")) {
                    this.changeNumber(10);
                }
                if (Input.isRepeated("down")) {
                    this.changeNumber(-10);
                }
            }
        }

        /**
         * 改變數量（會自動限制在 1 ~ max 之間）
         */
        changeNumber(amount) {
            const last = this._number;
            this._number = (this._number + amount).clamp(1, this._max);
            if (this._number !== last) {
                this.playCursorSound();
                this.refresh();
            }
        }

        /**
         * 取消鍵：直接觸發 cancel handler
         */
        processCancel() {
            super.processCancel();
        }

        /**
         * 確認鍵：執行 OK
         */
        processOk() {
            super.processOk();
        }

        /**
         * 預設此視窗只有 1 個項目（自身的計數區）
         */
        maxItems() {
            return 1;
        }

        /**
         * 繪製內容
         */
        refresh() {
            this.contents.clear();
            const recipe = this._recipe;
            if (!recipe) return;

            const gainItem = getDataItem(recipe.gainType, recipe.gainId);
            const costItem = getDataItem(recipe.costType, recipe.costId);
            if (!gainItem || !costItem) return;

            const lineHeight = this.lineHeight();
            let y = 0;

            // === 標題：兌換 ===
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("兌換數量", 0, y, this.innerWidth, "center");
            this.resetTextColor();
            y += lineHeight + 4;

            // === 顯示「獲得物品」 ===
            this.drawItemName(gainItem, 0, y, this.innerWidth - 100);
            this.drawText(`×${recipe.gainAmount * this._number}`, 0, y, this.innerWidth, "right");
            y += lineHeight;

            // === 顯示「消耗材料」 ===
            this.drawItemName(costItem, 0, y, this.innerWidth - 100);
            const costTotal = recipe.costAmount * this._number;
            this.drawText(`×${costTotal}`, 0, y, this.innerWidth, "right");
            y += lineHeight + 8;

            // === 顯示「數量數字」（在中央放大顯示） ===
            this.drawNumberBox(y);
        }

        /**
         * 繪製中央的數量數字
         */
        drawNumberBox(y) {
            const width = this.innerWidth;
            this.contents.fontSize = $gameSystem.mainFontSize() + 8;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText("數量", 0, y, width, "left");
            this.resetTextColor();

            const numberText = `× ${this._number}`;
            this.drawText(numberText, 0, y, width, "right");
            this.contents.fontSize = $gameSystem.mainFontSize();
        }

        /**
         * 用於 placeButtons 計算高度
         */
        itemY() {
            return this.lineHeight() * 4;
        }

        // ---- 按鈕回呼 ----
        onButtonUp()    { this.changeNumber(1);    }
        onButtonUp2()   { this.changeNumber(10);   }
        onButtonDown()  { this.changeNumber(-1);   }
        onButtonDown2() { this.changeNumber(-10);  }
        onButtonOk() {
            this.processOk();
        }
    }

    //=========================================================================
    // 將自訂類別暴露到全域（讓其他插件可繼承擴充）
    //=========================================================================
    window.Scene_BarterShop      = Scene_BarterShop;
    window.Window_BarterList     = Window_BarterList;
    window.Window_BarterStatus   = Window_BarterStatus;
    window.Window_BarterNumber   = Window_BarterNumber;

})();
