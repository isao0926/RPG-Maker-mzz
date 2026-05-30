//=============================================================================
// KateSumoGame.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.0] 相撲推擠小遊戲 - 透過快速連按對決 AI 對手的拔河式迷你遊戲
 * @author Kate Plugin Series
 * @url
 *
 * @help
 * ============================================================================
 * 【相撲推擠小遊戲】KateSumoGame.js
 * ============================================================================
 *
 * 這是一款「拔河/推擠式」的相撲迷你遊戲。
 *
 * 【遊戲規則】
 * - 畫面中央有一條「平衡量表」，初始值為 50（範圍 0 ~ 100）。
 * - 玩家快速連按「確定鍵（Z / Enter / 手機確認）」，使平衡值下降。
 * - 對手 AI 會定期自動發力，使平衡值上升。
 * - 平衡值 <= 0 → 玩家獲勝，指定變數寫入 1。
 * - 平衡值 >= 100 → 玩家失敗，指定變數寫入 2。
 *
 * 【使用方式】
 * 在事件的「插件指令」中呼叫 StartSumoGame，並設定對手的速度與力量。
 *
 * 【插件指令參數說明】
 * - opponentSpeed：對手每隔幾幀發力一次（數字越小越強勁，建議 20~60）
 * - opponentPower：對手每次發力讓平衡值增加多少點（建議 2~8）
 *
 * ============================================================================
 * 【版本記錄】
 * v1.0 - 初始版本
 * ============================================================================
 *
 * @param playerPower
 * @text 玩家連擊基本威力
 * @desc 玩家每按一次確定鍵，平衡值扣除的點數。
 * @type number
 * @decimals 1
 * @min 0.1
 * @max 20
 * @default 1.5
 *
 * @param resultVariableId
 * @text 勝負結果變數 ID
 * @desc 遊戲結束後，將結果（1=勝/2=敗）存入此變數 ID。
 * @type variable
 * @default 11
 *
 * @command StartSumoGame
 * @text 啟動相撲小遊戲
 * @desc 開始一場相撲推擠對決迷你遊戲。
 *
 * @arg opponentSpeed
 * @text 對手發力間隔（幀數）
 * @desc 對手每隔幾幀自動發力一次。數字越小代表對手越強。建議值：30
 * @type number
 * @min 5
 * @max 300
 * @default 30
 *
 * @arg opponentPower
 * @text 對手每次發力點數
 * @desc 對手每次發力使平衡值增加的點數。建議值：3
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 30
 * @default 3
 */

(() => {
    'use strict';

    //=========================================================================
    // ■ 插件名稱與參數讀取
    //=========================================================================
    const PLUGIN_NAME = 'KateSumoGame';

    /** 取得插件參數物件 */
    const parameters = PluginManager.parameters(PLUGIN_NAME);

    /** 玩家每次按鍵扣除的平衡值 */
    const PLAYER_POWER = parseFloat(parameters['playerPower'] || 1.5);

    /** 勝負結果存入的變數 ID */
    const RESULT_VARIABLE_ID = parseInt(parameters['resultVariableId'] || 11);

    //=========================================================================
    // ■ 插件指令註冊
    //=========================================================================

    /**
     * 註冊插件指令 StartSumoGame
     * 由事件編輯器的「插件指令」呼叫，帶入對手參數後切換場景。
     */
    PluginManager.registerCommand(PLUGIN_NAME, 'StartSumoGame', args => {
        /** 對手發力間隔幀數（最少 5 幀防止過快） */
        const opponentSpeed = Math.max(5, parseInt(args.opponentSpeed || 30));
        /** 對手每次發力的平衡值增量 */
        const opponentPower = parseFloat(args.opponentPower || 3);

        // 將參數儲存到全域暫存，供 Scene_Sumo 初始化時讀取
        Scene_Sumo.prepareParams(opponentSpeed, opponentPower);

        // 推入相撲場景，暫停地圖
        SceneManager.push(Scene_Sumo);
    });

    //=========================================================================
    // ■ Scene_Sumo（繼承 Scene_MenuBase）
    //=========================================================================

    /**
     * 相撲小遊戲的主場景。
     * 負責：
     * 1. 初始化遊戲狀態（平衡值、定時器等）
     * 2. 每幀更新輸入偵測與對手 AI 邏輯
     * 3. 判定勝負並寫入結果變數
     * 4. 建立並管理 Window_SumoGauge 量表視窗
     */
    class Scene_Sumo extends Scene_MenuBase {

        //---------------------------------------------------------------------
        // ◆ 靜態屬性：暫存插件指令傳入的參數
        //---------------------------------------------------------------------

        /**
         * 由插件指令呼叫，在場景建立前設定對手參數。
         * @param {number} speed - 對手發力間隔幀數
         * @param {number} power - 對手每次發力點數
         */
        static prepareParams(speed, power) {
            Scene_Sumo._opponentSpeed = speed;
            Scene_Sumo._opponentPower = power;
        }

        //---------------------------------------------------------------------
        // ◆ 初始化
        //---------------------------------------------------------------------

        initialize() {
            super.initialize();
        }

        //---------------------------------------------------------------------
        // ◆ create()：建立場景所有子物件
        //---------------------------------------------------------------------

        create() {
            super.create();
            this._initGameState();
            this._createBackground();
            this._createGaugeWindow();
            this._createInfoWindows();
        }

        /**
         * 初始化遊戲核心狀態變數。
         * 所有定時器與計分都封裝在 Scene 內，不汙染全域。
         */
        _initGameState() {
            /** 平衡值：初始 50，0 = 玩家贏，100 = 玩家輸 */
            this._balance = 50;

            /** 對手發力計數器：累積到 _opponentSpeed 時觸發 */
            this._opponentTimer = 0;

            /** 對手發力間隔（幀） */
            this._opponentSpeed = Scene_Sumo._opponentSpeed || 30;

            /** 對手每次發力增加的平衡值 */
            this._opponentPower = Scene_Sumo._opponentPower || 3;

            /** 遊戲是否已結束（防止重複觸發結算） */
            this._gameOver = false;

            /** 按鍵冷卻計數器：防止同一幀被多次觸發 */
            this._inputCooldown = 0;

            /** 結果顯示延遲計數器：勝負後等待一段時間再關閉場景 */
            this._closeTimer = 0;

            /** 結果文字（用於畫面顯示） */
            this._resultText = '';

            /** 玩家連擊視覺效果計數器（用於量表震動動畫） */
            this._hitEffect = 0;

            /** 對手發力視覺效果計數器 */
            this._opponentEffect = 0;
        }

        //---------------------------------------------------------------------
        // ◆ 背景建立
        //---------------------------------------------------------------------

        /**
         * 建立場景背景：
         * 使用黑色半透明蒙版覆蓋地圖，營造聚焦感。
         */
        _createBackground() {
            this._backgroundFilter = new PIXI.Graphics();
            // 繪製全螢幕半透明黑色遮罩
            this._backgroundFilter.beginFill(0x000000, 0.75);
            this._backgroundFilter.drawRect(0, 0, Graphics.width, Graphics.height);
            this._backgroundFilter.endFill();
            this.addChild(this._backgroundFilter);
        }

        //---------------------------------------------------------------------
        // ◆ 量表視窗建立
        //---------------------------------------------------------------------

        /**
         * 建立核心量表視窗 Window_SumoGauge，
         * 置中顯示在畫面中央偏上方。
         */
        _createGaugeWindow() {
            const ww = Graphics.boxWidth - 80;
            const wh = 180;
            const wx = 40;
            const wy = Math.floor(Graphics.boxHeight / 2) - 120;

            this._gaugeWindow = new Window_SumoGauge(
                new Rectangle(wx, wy, ww, wh)
            );
            this._gaugeWindow.setBalance(this._balance);
            this.addWindow(this._gaugeWindow);
        }

        //---------------------------------------------------------------------
        // ◆ 提示文字視窗建立
        //---------------------------------------------------------------------

        /**
         * 建立操作提示視窗（顯示按鍵說明）與結果顯示視窗。
         */
        _createInfoWindows() {
            // 操作說明視窗（畫面底部）
            const hintY = Math.floor(Graphics.boxHeight / 2) + 80;
            this._hintWindow = new Window_Base(
                new Rectangle(40, hintY, Graphics.boxWidth - 80, 80)
            );
            this._hintWindow.drawText(
                '⚡ 快速連按「確定鍵 / Z / Enter」推倒對手！',
                0, 0,
                this._hintWindow.innerWidth,
                'center'
            );
            this.addWindow(this._hintWindow);

            // 結果顯示視窗（初始隱藏）
            const resultW = 400;
            const resultH = 100;
            const resultX = Math.floor((Graphics.boxWidth - resultW) / 2);
            const resultY = Math.floor(Graphics.boxHeight / 2) - 50;
            this._resultWindow = new Window_Base(
                new Rectangle(resultX, resultY, resultW, resultH)
            );
            this._resultWindow.visible = false;
            this.addWindow(this._resultWindow);
        }

        //---------------------------------------------------------------------
        // ◆ start()：場景啟動
        //---------------------------------------------------------------------

        start() {
            super.start();
        }

        //---------------------------------------------------------------------
        // ◆ update()：每幀主要更新邏輯
        //---------------------------------------------------------------------

        update() {
            super.update();

            // 若遊戲已結束，僅處理關閉倒數
            if (this._gameOver) {
                this._updateCloseTimer();
                return;
            }

            // 更新按鍵冷卻
            if (this._inputCooldown > 0) this._inputCooldown--;

            // 更新視覺效果計數器（震動用）
            if (this._hitEffect > 0) this._hitEffect--;
            if (this._opponentEffect > 0) this._opponentEffect--;

            // 偵測玩家輸入
            this._updatePlayerInput();

            // 更新對手 AI 定時發力
            this._updateOpponent();

            // 更新量表顯示
            this._gaugeWindow.setBalance(this._balance);
            this._gaugeWindow.setEffects(this._hitEffect, this._opponentEffect);

            // 檢查勝負判定
            this._checkWinCondition();
        }

        //---------------------------------------------------------------------
        // ◆ 玩家輸入處理
        //---------------------------------------------------------------------

        /**
         * 偵測玩家按下確定鍵（ok / Z / Enter）。
         * 每次成功按鍵會扣減平衡值，並觸發視覺回饋。
         * 使用 isTriggered（瞬間觸發）確保每次按鍵只計算一次。
         */
        _updatePlayerInput() {
            if (Input.isTriggered('ok') && this._inputCooldown <= 0) {
                // 扣減平衡值（玩家發力）
                this._balance -= PLAYER_POWER;
                this._balance = Math.max(0, this._balance);

                // 設定按鍵冷卻（防止連按過快漏算，給 2 幀緩衝）
                this._inputCooldown = 2;

                // 觸發玩家打擊視覺效果（持續 8 幀）
                this._hitEffect = 8;

                // 播放音效（使用系統的 ok 音效作為打擊回饋）
                SoundManager.playCursor();
            }
        }

        //---------------------------------------------------------------------
        // ◆ 對手 AI 邏輯
        //---------------------------------------------------------------------

        /**
         * 對手定時發力邏輯。
         * 每累積 _opponentSpeed 幀，自動增加平衡值（對手推擠）。
         */
        _updateOpponent() {
            this._opponentTimer++;

            if (this._opponentTimer >= this._opponentSpeed) {
                // 重置計數器
                this._opponentTimer = 0;

                // 對手發力：增加平衡值
                this._balance += this._opponentPower;
                this._balance = Math.min(100, this._balance);

                // 觸發對手發力視覺效果（持續 10 幀）
                this._opponentEffect = 10;

                // 播放對手發力音效（使用敵人攻擊音效）
                if (typeof SoundManager.playEnemyAttack === 'function') {
                    SoundManager.playEnemyAttack();
                } else {
                    // 備用：使用 buzzer 音效
                    SoundManager.playBuzzer();
                }
            }
        }

        //---------------------------------------------------------------------
        // ◆ 勝負判定
        //---------------------------------------------------------------------

        /**
         * 檢查平衡值是否觸及邊界，決定勝負。
         * 平衡值 <= 0：玩家獲勝（變數寫入 1）
         * 平衡值 >= 100：玩家失敗（變數寫入 2）
         */
        _checkWinCondition() {
            if (this._balance <= 0) {
                this._endGame(1); // 玩家勝
            } else if (this._balance >= 100) {
                this._endGame(2); // 玩家敗
            }
        }

        //---------------------------------------------------------------------
        // ◆ 遊戲結束處理
        //---------------------------------------------------------------------

        /**
         * 結束遊戲：寫入結果變數，顯示結果畫面，啟動關閉倒數。
         * @param {number} result - 1 = 玩家勝利，2 = 玩家失敗
         */
        _endGame(result) {
            if (this._gameOver) return; // 防止重複觸發

            this._gameOver = true;

            // 將結果寫入指定的遊戲變數
            $gameVariables.setValue(RESULT_VARIABLE_ID, result);

            // 顯示結果畫面
            this._showResult(result);

            // 啟動關閉倒數（120 幀 = 2 秒後自動關閉）
            this._closeTimer = 120;
        }

        /**
         * 在結果視窗上繪製勝敗訊息。
         * @param {number} result - 1 = 勝，2 = 敗
         */
        _showResult(result) {
            const win = this._resultWindow;
            win.visible = true;
            win.contents.clear();

            if (result === 1) {
                // 玩家勝利
                win.changeTextColor(ColorManager.powerUpColor());
                win.drawText('🏆 你贏了！對手被推出去！', 0, 10, win.innerWidth, 'center');
                SoundManager.playVictory ? SoundManager.playVictory() : SoundManager.playOk();
            } else {
                // 玩家失敗
                win.changeTextColor(ColorManager.powerDownColor());
                win.drawText('💨 你被推出去了...下次加油！', 0, 10, win.innerWidth, 'center');
                SoundManager.playBuzzer();
            }

            // 隱藏量表視窗的對手效果，讓結果更清晰
            this._gaugeWindow.freezeOnResult(result);
        }

        //---------------------------------------------------------------------
        // ◆ 關閉倒數計時
        //---------------------------------------------------------------------

        /**
         * 遊戲結束後的等待計時器。
         * 倒數歸零後自動 popScene 返回地圖。
         */
        _updateCloseTimer() {
            this._closeTimer--;
            if (this._closeTimer <= 0) {
                this.popScene();
            }
        }

        //---------------------------------------------------------------------
        // ◆ terminate()：場景清理
        //---------------------------------------------------------------------

        terminate() {
            super.terminate();
        }

    } // end class Scene_Sumo

    // 將 Scene_Sumo 掛載到全域，讓 SceneManager 可以正確識別
    window.Scene_Sumo = Scene_Sumo;

    //=========================================================================
    // ■ Window_SumoGauge（繼承 Window_Base）
    //=========================================================================

    /**
     * 相撲量表視窗。
     * 繪製核心的「平衡量表」：
     * - 左半邊（藍色）代表玩家優勢
     * - 右半邊（紅色）代表對手優勢
     * - 中央垂直指針顯示當前平衡位置
     * - 支援打擊震動動畫效果
     */
    class Window_SumoGauge extends Window_Base {

        //---------------------------------------------------------------------
        // ◆ 初始化
        //---------------------------------------------------------------------

        initialize(rect) {
            super.initialize(rect);

            /** 當前平衡值 (0~100) */
            this._balance = 50;

            /** 玩家打擊效果剩餘幀數 */
            this._hitEffect = 0;

            /** 對手發力效果剩餘幀數 */
            this._opponentEffect = 0;

            /** 遊戲結果（0=進行中, 1=玩家勝, 2=玩家敗） */
            this._result = 0;

            // 初始繪製
            this.refresh();
        }

        //---------------------------------------------------------------------
        // ◆ 公開介面：由 Scene_Sumo 呼叫更新數值
        //---------------------------------------------------------------------

        /**
         * 設定新的平衡值並重新繪製量表。
         * @param {number} balance - 新的平衡值 (0~100)
         */
        setBalance(balance) {
            if (this._balance !== balance) {
                this._balance = balance;
                this.refresh();
            }
        }

        /**
         * 設定視覺效果狀態（供震動動畫使用）。
         * @param {number} hitEffect - 玩家打擊效果幀數
         * @param {number} opponentEffect - 對手效果幀數
         */
        setEffects(hitEffect, opponentEffect) {
            this._hitEffect = hitEffect;
            this._opponentEffect = opponentEffect;
            // 有效果時每幀都需要重繪（呈現震動感）
            if (hitEffect > 0 || opponentEffect > 0) {
                this.refresh();
            }
        }

        /**
         * 遊戲結束時凍結量表並標記結果色。
         * @param {number} result - 1 = 玩家勝，2 = 玩家敗
         */
        freezeOnResult(result) {
            this._result = result;
            this.refresh();
        }

        //---------------------------------------------------------------------
        // ◆ refresh()：完整重繪量表
        //---------------------------------------------------------------------

        /**
         * 清空並重繪所有量表元素。
         * 包含：背景、量表填色、指針、文字標籤、震動效果。
         */
        refresh() {
            this.contents.clear();
            this._drawGaugeBackground();
            this._drawGaugeFill();
            this._drawGaugeDivider();
            this._drawPointer();
            this._drawLabels();
            this._drawBalanceText();
            if (this._hitEffect > 0) this._drawHitEffect();
            if (this._opponentEffect > 0) this._drawOpponentEffect();
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：量表背景
        //---------------------------------------------------------------------

        /**
         * 繪製量表底色背景條（深灰色圓角矩形）。
         */
        _drawGaugeBackground() {
            const gx = 20;
            const gy = 50;
            const gw = this.innerWidth - 40;
            const gh = 40;

            // 背景填色（深灰）
            this.contents.fillRect(gx, gy, gw, gh, '#2a2a2a');

            // 邊框（稍淺的灰色）
            this.contents.strokeRect(gx, gy, gw, gh, '#666666', 2);
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：量表填色
        //---------------------------------------------------------------------

        /**
         * 根據當前平衡值繪製量表的填色區域。
         * - 左側（玩家優勢）填藍色
         * - 右側（對手優勢）填紅色
         * - 平衡值代表「對手的勢力範圍比例」（值越高對手越強）
         */
        _drawGaugeFill() {
            const gx = 20;
            const gy = 50;
            const gw = this.innerWidth - 40;
            const gh = 40;

            // 計算分隔點（平衡值代表對手佔的比例）
            const splitX = gx + Math.floor(gw * (this._balance / 100));

            // 玩家優勢區（左側，藍色漸層）
            const playerWidth = splitX - gx;
            if (playerWidth > 0) {
                this.contents.fillRect(gx, gy, playerWidth, gh, '#1a5fa8');
                // 高光效果（上方更亮的藍）
                this.contents.fillRect(gx, gy, playerWidth, Math.floor(gh / 3), '#2980e8');
            }

            // 對手優勢區（右側，紅色漸層）
            const opponentWidth = (gx + gw) - splitX;
            if (opponentWidth > 0) {
                this.contents.fillRect(splitX, gy, opponentWidth, gh, '#a81a1a');
                // 高光效果（上方更亮的紅）
                this.contents.fillRect(splitX, gy, opponentWidth, Math.floor(gh / 3), '#e82929');
            }
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：中央分隔線（50% 基準線）
        //---------------------------------------------------------------------

        /**
         * 在量表正中央（50% 位置）繪製黃色虛線，作為平衡基準。
         */
        _drawGaugeDivider() {
            const gx = 20;
            const gy = 50;
            const gw = this.innerWidth - 40;
            const gh = 40;
            const centerX = gx + Math.floor(gw / 2);

            // 黃色中線
            this.contents.fillRect(centerX - 1, gy, 2, gh, '#ffdd00');
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：指針
        //---------------------------------------------------------------------

        /**
         * 繪製表示當前平衡值位置的指針（白色三角形或垂直線）。
         * 同時根據效果幀數加入輕微的位移偏移，模擬震動感。
         */
        _drawPointer() {
            const gx = 20;
            const gy = 50;
            const gw = this.innerWidth - 40;
            const gh = 40;

            // 計算指針 X 座標（加入震動偏移）
            let shakeOffset = 0;
            if (this._hitEffect > 0) {
                // 玩家打擊時：向左微震（最大 ±3 像素）
                shakeOffset = -(this._hitEffect % 2 === 0 ? 2 : -2);
            } else if (this._opponentEffect > 0) {
                // 對手發力時：向右微震
                shakeOffset = (this._opponentEffect % 2 === 0 ? 2 : -2);
            }

            const pointerX = gx + Math.floor(gw * (this._balance / 100)) + shakeOffset;
            const clampedX = Math.max(gx, Math.min(gx + gw, pointerX));

            // 指針主體（白色粗線）
            this.contents.fillRect(clampedX - 2, gy - 8, 4, gh + 16, '#ffffff');

            // 指針頂端三角形指示頭（上）
            this._drawTriangle(clampedX, gy - 12, 8, '#ffffff', 'down');

            // 指針底端三角形指示頭（下）
            this._drawTriangle(clampedX, gy + gh + 12, 8, '#ffffff', 'up');
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：三角形指示頭（輔助函式）
        //---------------------------------------------------------------------

        /**
         * 用填充矩形拼出簡易三角形（PIXI Bitmap 不支援原生三角形）。
         * @param {number} cx - 三角形中心 X
         * @param {number} cy - 三角形頂點 Y
         * @param {number} size - 三角形半寬
         * @param {string} color - 顏色字串
         * @param {string} direction - 'up' 或 'down'
         */
        _drawTriangle(cx, cy, size, color, direction) {
            // 用多層漸縮矩形模擬三角形
            for (let i = 0; i < size; i++) {
                const w = (size - i) * 2;
                const x = cx - (size - i);
                const y = direction === 'down' ? cy + i : cy - i - 1;
                this.contents.fillRect(x, y, w, 1, color);
            }
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：標籤文字
        //---------------------------------------------------------------------

        /**
         * 在量表左右兩側繪製角色標籤與表情符號。
         */
        _drawLabels() {
            // 玩家標籤（左側，藍色）
            this.changeTextColor('#4da6ff');
            this.drawText('👊 你', 20, 100, 120, 'left');

            // 對手標籤（右側，紅色）
            this.changeTextColor('#ff4d4d');
            this.drawText('對手 🔥', this.innerWidth - 140, 100, 120, 'right');

            // 恢復預設顏色
            this.resetTextColor();
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：平衡值數字
        //---------------------------------------------------------------------

        /**
         * 在量表上方中央顯示當前平衡值（除錯/視覺用）。
         * 同時根據結果顯示勝敗狀態色。
         */
        _drawBalanceText() {
            let label = '';
            let color = '#ffffff';

            if (this._result === 1) {
                label = '★ 勝利！★';
                color = '#ffd700';
            } else if (this._result === 2) {
                label = '☆ 失敗... ☆';
                color = '#ff6666';
            } else {
                // 顯示優勢方向提示
                if (this._balance < 45) {
                    label = '← 你佔優勢！';
                    color = '#4da6ff';
                } else if (this._balance > 55) {
                    label = '→ 對手佔優勢！';
                    color = '#ff4d4d';
                } else {
                    label = '⚖ 勢均力敵！';
                    color = '#ffdd00';
                }
            }

            this.changeTextColor(color);
            this.drawText(label, 0, 10, this.innerWidth, 'center');
            this.resetTextColor();
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：玩家打擊視覺效果
        //---------------------------------------------------------------------

        /**
         * 玩家成功按鍵時，在量表左側閃現打擊特效文字。
         */
        _drawHitEffect() {
            const alpha = this._hitEffect / 8; // 根據剩餘幀數計算透明度
            const effectColor = `rgba(77, 166, 255, ${alpha})`;
            this.changeTextColor(effectColor);
            this.drawText('PUSH！', 20, 50, 100, 'left');
            this.resetTextColor();
        }

        //---------------------------------------------------------------------
        // ◆ 繪製：對手發力視覺效果
        //---------------------------------------------------------------------

        /**
         * 對手發力時，在量表右側閃現警示特效文字。
         */
        _drawOpponentEffect() {
            const alpha = this._opponentEffect / 10;
            const effectColor = `rgba(255, 77, 77, ${alpha})`;
            this.changeTextColor(effectColor);
            this.drawText('PUSH！', this.innerWidth - 120, 50, 100, 'right');
            this.resetTextColor();
        }

    } // end class Window_SumoGauge

    // 掛載到全域
    window.Window_SumoGauge = Window_SumoGauge;

})();
