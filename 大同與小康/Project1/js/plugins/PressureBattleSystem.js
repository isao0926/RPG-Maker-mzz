//=============================================================================
// PressureBattleSystem.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 壓境戰鬥系統 - 在原生回合制戰鬥中加入戰線條與敵人招式即時反應 QTE。
 * @author You
 *
 * @param gaugeX
 * @text 戰線條 X 座標
 * @desc 戰線條左上角的 X 座標 (像素)。預設 816x624 解析度大約置中。
 * @type number
 * @min 0
 * @default 108
 *
 * @param gaugeY
 * @text 戰線條 Y 座標
 * @desc 戰線條左上角的 Y 座標 (像素)。建議放在戰鬥畫面下方但不蓋住角色指令視窗。
 * @type number
 * @min 0
 * @default 300
 *
 * @param gaugeWidth
 * @text 戰線條寬度
 * @desc 戰線條寬度 (像素)。
 * @type number
 * @min 1
 * @default 600
 *
 * @param gaugeHeight
 * @text 戰線條高度
 * @desc 戰線條高度 (像素)。
 * @type number
 * @min 1
 * @default 24
 *
 * @param initialPressure
 * @text 初始戰線值
 * @desc 戰鬥開始時的戰線值。
 * @type number
 * @min 0
 * @default 50
 *
 * @param maxPressure
 * @text 最大戰線值
 * @desc 戰線值上限 (達到此值 = 敵人破防)。
 * @type number
 * @min 1
 * @default 100
 *
 * @param breakStateId
 * @text 破防狀態 ID
 * @desc 敵人破防時附加的狀態 ID (資料庫>狀態)。設 0 則不附加狀態，仍會有破防傷害加成。
 * @type state
 * @default 0
 *
 * @param crisisStateId
 * @text 危機狀態 ID
 * @desc 玩家陷入危機時附加的狀態 ID。設 0 則不附加狀態。
 * @type state
 * @default 0
 *
 * @param breakDamageRate
 * @text 破防傷害倍率
 * @desc 攻擊破防敵人時的傷害倍率 (技能可用 <BreakBonus:x> 個別覆蓋)。
 * @type number
 * @decimals 2
 * @min 0
 * @default 2.00
 *
 * @param crisisDamage
 * @text 危機傷害
 * @desc 玩家陷入危機時受到的額外固定傷害。
 * @type number
 * @min 0
 * @default 50
 *
 * @param defaultReactionTime
 * @text 預設反應時間
 * @desc 敵人未設定 <PressureSpeed:x> 時的反應時間 (幀，60 幀 = 1 秒)。
 * @type number
 * @min 1
 * @default 60
 *
 * @param sweepSuccess
 * @text 橫掃成功戰線變化
 * @desc 橫掃閃避成功時戰線變化量 (正數 = 增加)。
 * @type number
 * @min -1000
 * @default 8
 *
 * @param sweepFail
 * @text 橫掃失敗戰線變化
 * @desc 橫掃閃避失敗時戰線變化量 (負數 = 減少)。
 * @type number
 * @min -1000
 * @default -10
 *
 * @param heavySuccess
 * @text 重擊成功戰線變化
 * @desc 重擊一般格擋成功時戰線變化量。
 * @type number
 * @min -1000
 * @default 6
 *
 * @param heavyPerfect
 * @text 重擊完美戰線變化
 * @desc 重擊完美格擋時戰線變化量。
 * @type number
 * @min -1000
 * @default 12
 *
 * @param heavyFail
 * @text 重擊失敗戰線變化
 * @desc 重擊格擋失敗時戰線變化量。
 * @type number
 * @min -1000
 * @default -12
 *
 * @param thrustSuccess
 * @text 突刺成功戰線變化
 * @desc 突刺反擊成功時戰線變化量。
 * @type number
 * @min -1000
 * @default 10
 *
 * @param thrustFail
 * @text 突刺失敗戰線變化
 * @desc 突刺反擊失敗時戰線變化量。
 * @type number
 * @min -1000
 * @default -10
 *
 * @param enableSe
 * @text 啟用音效
 * @desc 是否播放音效。
 * @type boolean
 * @on 開啟
 * @off 關閉
 * @default true
 *
 * @param successSe
 * @text 成功音效
 * @desc 反應成功時的音效檔名 (audio/se)。
 * @type file
 * @dir audio/se
 * @default Decision2
 *
 * @param failSe
 * @text 失敗音效
 * @desc 反應失敗時的音效檔名。
 * @type file
 * @dir audio/se
 * @default Buzzer1
 *
 * @param breakSe
 * @text 破防音效
 * @desc 敵人破防時的音效檔名。
 * @type file
 * @dir audio/se
 * @default Flash1
 *
 * @param crisisSe
 * @text 危機音效
 * @desc 玩家陷入危機時的音效檔名。
 * @type file
 * @dir audio/se
 * @default Damage5
 *
 * @help
 * ============================================================================
 * 壓境戰鬥系統 PressureBattleSystem.js
 * ============================================================================
 *
 * 在原生 RPG Maker MZ 回合制戰鬥中加入一條「戰線條」(0~100)，以及敵人行動時的
 * 即時反應 QTE。本外掛「不」切換場景、「不」重寫 BattleManager，而是以別名 (alias)
 * 的方式掛在原生流程上，盡量保持相容。
 *
 * ----------------------------------------------------------------------------
 * 戰線條
 * ----------------------------------------------------------------------------
 *   0   = 玩家被壓到底 → 玩家陷入危機 (受到額外傷害，戰線重置回初始值)
 *   100 = 敵人被壓到底 → 敵人破防 (玩家下一擊傷害提升，戰線重置回初始值)
 *
 * ----------------------------------------------------------------------------
 * 敵人行動 → 壓境操作階段 (QTE)
 * ----------------------------------------------------------------------------
 * 當敵人使用「會對我方造成 HP/MP 傷害」的行動時，戰鬥會在套用傷害前暫停，
 * 並進入操作階段，玩家需在限定時間內按下正確按鍵：
 *
 *   sweep  橫掃：按 方向鍵 ← 或 →
 *            成功 → 不受傷、戰線增加
 *            失敗 → 受到傷害、戰線減少
 *   heavy  重擊：按 OK 鍵 (Z / Enter / Space)
 *            一般成功 → 減少傷害、戰線增加
 *            完美格擋 → 不受傷、戰線大幅增加 (在倒數快結束時按下)
 *            失敗     → 受到完整傷害、戰線減少
 *   thrust 突刺：按 Cancel 鍵 (X / Esc)
 *            成功 → 反擊敵人、不受傷、戰線增加
 *            失敗 → 受到傷害、戰線減少
 *
 * 按錯鍵或超時都算失敗。
 *
 * ----------------------------------------------------------------------------
 * 敵人備註欄 (Enemy Note)
 * ----------------------------------------------------------------------------
 *   <PressureMoves:sweep,heavy,thrust>   可用招式 (隨機抽)；未設定預設為 heavy
 *   <PressureSpeed:60>                   反應時間 (幀)；未設定使用參數 Default Reaction Time
 *   <PressurePower:15>                   壓迫力量；反應失敗時對玩家追加的固定傷害
 *
 * ----------------------------------------------------------------------------
 * 技能/道具備註欄 (Skill / Item Note)
 * ----------------------------------------------------------------------------
 *   <PressurePush:10>   玩家使用此技能後，戰線增加 10
 *   <BreakBonus:2.0>    此技能攻擊「破防中」的敵人時，改用 2.0 倍傷害 (覆蓋全域倍率)
 *
 * ----------------------------------------------------------------------------
 * 微調用的程式內常數 (在檔案上方 PBS 物件中)
 * ----------------------------------------------------------------------------
 *   PBS.PERFECT_WINDOW   完美格擋的判定幀數 (倒數剩下幾幀以內按下算完美)
 *   PBS.HEAVY_GUARD_RATE 重擊一般格擋成功時，傷害保留比例 (0.5 = 受到一半)
 *   PBS.RESULT_FRAMES    結果文字顯示/暫停的幀數
 *   PBS.counterDamage()  突刺反擊傷害公式 (預設簡易公式，可自行替換)
 *
 * 以上保留為擴充位置，方便你之後修改。
 * ============================================================================
 */

(() => {
    "use strict";

    //=========================================================================
    // 命名空間與參數
    //=========================================================================
    const PLUGIN_NAME = "PressureBattleSystem";
    const raw = PluginManager.parameters(PLUGIN_NAME);

    const PBS = window.PBS || {};
    window.PBS = PBS;

    // --- 讀取參數 (一律透過 PluginManager.parameters) ---------------------
    PBS.params = {
        gaugeX:             Number(raw.gaugeX || 108),
        gaugeY:             Number(raw.gaugeY || 300),
        gaugeWidth:         Number(raw.gaugeWidth || 600),
        gaugeHeight:        Number(raw.gaugeHeight || 24),
        initialPressure:    Number(raw.initialPressure || 50),
        maxPressure:        Number(raw.maxPressure || 100),
        breakStateId:       Number(raw.breakStateId || 0),
        crisisStateId:      Number(raw.crisisStateId || 0),
        breakDamageRate:    Number(raw.breakDamageRate || 2.0),
        crisisDamage:       Number(raw.crisisDamage || 50),
        defaultReactionTime:Number(raw.defaultReactionTime || 60),
        sweepSuccess:       Number(raw.sweepSuccess || 8),
        sweepFail:          Number(raw.sweepFail || -10),
        heavySuccess:       Number(raw.heavySuccess || 6),
        heavyPerfect:       Number(raw.heavyPerfect || 12),
        heavyFail:          Number(raw.heavyFail || -12),
        thrustSuccess:      Number(raw.thrustSuccess || 10),
        thrustFail:         Number(raw.thrustFail || -10),
        enableSe:           String(raw.enableSe || "true") === "true",
        successSe:          String(raw.successSe || "Decision2"),
        failSe:             String(raw.failSe || "Buzzer1"),
        breakSe:            String(raw.breakSe || "Flash1"),
        crisisSe:           String(raw.crisisSe || "Damage5"),
    };

    // --- 可微調的程式內常數 (擴充位置) ------------------------------------
    PBS.PERFECT_WINDOW   = 10;    // 倒數剩 <= 此幀數內按 OK = 完美格擋
    PBS.HEAVY_GUARD_RATE = 0.5;   // 重擊一般成功時，傷害保留比例
    PBS.RESULT_FRAMES    = 50;    // 結果文字顯示與戰鬥暫停的幀數

    // 突刺反擊傷害公式 (簡易版，可自行替換成完整 Game_Action 流程)
    PBS.counterDamage = function (actor, enemy) {
        const atk = actor ? actor.atk : 10;
        const def = enemy ? enemy.def : 0;
        return Math.max(1, Math.floor(atk * 2 - def));
    };

    //=========================================================================
    // 備註欄 (Note) 解析輔助
    // RMMZ 會自動把 <key:value> 解析進 .meta，因此這裡直接讀 meta 即可。
    //=========================================================================
    const VALID_MOVES = ["sweep", "heavy", "thrust"];

    PBS.enemyMoves = function (enemy) {
        const meta = enemy && enemy.enemy() ? enemy.enemy().meta.PressureMoves : null;
        if (meta) {
            const list = String(meta)
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .filter((s) => VALID_MOVES.includes(s));
            if (list.length > 0) return list;
        }
        return ["heavy"]; // 未設定時的預設招式
    };

    PBS.pickMove = function (enemy) {
        const list = PBS.enemyMoves(enemy);
        return list[Math.floor(Math.random() * list.length)];
    };

    PBS.enemySpeed = function (enemy) {
        const meta = enemy && enemy.enemy() ? enemy.enemy().meta.PressureSpeed : null;
        const v = meta ? Number(meta) : PBS.params.defaultReactionTime;
        return v > 0 ? v : PBS.params.defaultReactionTime;
    };

    PBS.enemyPower = function (enemy) {
        const meta = enemy && enemy.enemy() ? enemy.enemy().meta.PressurePower : null;
        return meta ? Number(meta) : 0;
    };

    PBS.skillPush = function (item) {
        if (item && item.meta && item.meta.PressurePush != null) {
            return Number(item.meta.PressurePush);
        }
        return 0;
    };

    PBS.skillBreakBonus = function (item) {
        if (item && item.meta && item.meta.BreakBonus != null) {
            return Number(item.meta.BreakBonus);
        }
        return null; // null = 沒設定，改用全域 Break Damage Rate
    };

    //=========================================================================
    // 通用輔助
    //=========================================================================
    PBS.firstAliveEnemy = function () {
        const members = $gameTroop ? $gameTroop.aliveMembers() : [];
        return members.length > 0 ? members[0] : null;
    };

    PBS.firstAliveActor = function () {
        const members = $gameParty ? $gameParty.aliveMembers() : [];
        return members.length > 0 ? members[0] : null;
    };

    PBS.playSe = function (name) {
        if (!PBS.params.enableSe || !name) return;
        AudioManager.playSe({ name: name, volume: 90, pitch: 100, pan: 0 });
    };

    // 直接對 battler 套用一筆傷害並顯示傷害彈出 (用於反擊/危機)
    PBS.dealDirectDamage = function (battler, value) {
        if (!battler || value <= 0) return;
        battler.clearResult();
        const result = battler.result();
        result.used = true;
        result.hpAffected = true;
        result.hpDamage = value;
        battler.gainHp(-value);
        battler.startDamagePopup();
        battler.performDamage();
        if (battler.isDead()) {
            battler.performCollapse();
        }
        battler.refresh();
    };

    //=========================================================================
    // 戰線值變化 + 破防 / 危機判定
    //=========================================================================
    PBS.flashResult = function (bm, text) {
        bm._pbsResultText = text;
        bm._pbsResultTimer = PBS.RESULT_FRAMES;
    };

    // delta: 正數增加、負數減少
    // ctx: { breakEnemy: 破防時要套用的敵人, crisisActor: 危機時要受傷的角色 }
    PBS.applyPressureDelta = function (bm, delta, ctx) {
        ctx = ctx || {};
        bm._pressureValue += delta;

        const max = PBS.params.maxPressure;
        if (bm._pressureValue >= max) {
            bm._pressureValue = max;
            PBS.triggerBreak(bm, ctx.breakEnemy);
        } else if (bm._pressureValue <= 0) {
            bm._pressureValue = 0;
            PBS.triggerCrisis(bm, ctx.crisisActor);
        } else {
            // 一般範圍內，無事發生
        }
    };

    PBS.triggerBreak = function (bm, enemy) {
        enemy = (enemy && enemy.isAlive && enemy.isAlive()) ? enemy : PBS.firstAliveEnemy();
        if (enemy) {
            enemy._pbsBroken = true; // 以自訂旗標作為破防判定來源 (不依賴資料庫狀態)
            if (PBS.params.breakStateId > 0) {
                enemy.addState(PBS.params.breakStateId);
            }
            enemy.refresh();
        }
        PBS.flashResult(bm, "敵人破防！");
        PBS.playSe(PBS.params.breakSe);
        // 破防後重置戰線，形成循環 (如不想重置可註解掉此行)
        bm._pressureValue = PBS.params.initialPressure;
    };

    PBS.triggerCrisis = function (bm, actor) {
        actor = (actor && actor.isAlive && actor.isAlive()) ? actor : PBS.firstAliveActor();
        if (actor) {
            if (PBS.params.crisisDamage > 0) {
                PBS.dealDirectDamage(actor, PBS.params.crisisDamage);
            }
            if (PBS.params.crisisStateId > 0) {
                actor.addState(PBS.params.crisisStateId);
                actor.refresh();
            }
        }
        PBS.flashResult(bm, "玩家陷入危機！");
        PBS.playSe(PBS.params.crisisSe);
        // 危機後戰線回到初始值
        bm._pressureValue = PBS.params.initialPressure;
    };

    // 破防消耗：玩家攻擊破防敵人後，移除破防狀態 (只加成「下一擊」)
    PBS.consumeBreak = function (enemy) {
        if (!enemy) return;
        enemy._pbsBroken = false;
        if (PBS.params.breakStateId > 0) {
            enemy.removeState(PBS.params.breakStateId);
        }
        enemy.refresh();
    };

    //=========================================================================
    // QTE (壓境操作階段) 狀態機
    // 狀態存在 BattleManager，邏輯集中在這裡，HUD 只負責讀取並繪製。
    //=========================================================================
    PBS.startReaction = function (bm) {
        bm._pbsPhase = "active";
        bm._pbsMove = bm._pbsPendingMove;
        bm._pbsTimerMax = bm._pbsTimerMax || PBS.params.defaultReactionTime;
        bm._pbsTimer = bm._pbsTimerMax;
        bm._pbsOutcome = null;
    };

    // 每幀讀取輸入；回傳 'ok' / 'cancel' / 'left' / 'right' / null
    PBS.readInput = function () {
        if (Input.isTriggered("ok")) return "ok";        // Z / Enter / Space
        if (Input.isTriggered("cancel")) return "cancel"; // X / Esc
        if (Input.isTriggered("left")) return "left";
        if (Input.isTriggered("right")) return "right";
        return null;
    };

    PBS.isCorrectKey = function (move, key) {
        switch (move) {
            case "sweep":  return key === "left" || key === "right";
            case "heavy":  return key === "ok";
            case "thrust": return key === "cancel";
        }
        return false;
    };

    PBS.updateReaction = function (bm) {
        if (bm._pbsPhase === "active") {
            const key = PBS.readInput();
            if (key) {
                if (PBS.isCorrectKey(bm._pbsMove, key)) {
                    PBS.resolveSuccess(bm);
                } else {
                    PBS.resolveFail(bm); // 按錯鍵
                }
            } else {
                bm._pbsTimer--;
                if (bm._pbsTimer <= 0) {
                    PBS.resolveFail(bm); // 超時
                }
            }
        } else if (bm._pbsPhase === "result") {
            // 結果展示期間阻擋戰鬥；計時由 PBS.updateGlobal 處理。
            if (bm._pbsResultTimer <= 0) {
                bm._pbsPhase = "idle";
                bm._pbsDone = true;
            }
        }
    };

    PBS.beginResult = function (bm, text) {
        bm._pbsPhase = "result";
        bm._pbsResultText = text;
        bm._pbsResultTimer = PBS.RESULT_FRAMES;
    };

    PBS.resolveSuccess = function (bm) {
        const move = bm._pbsMove;
        const p = PBS.params;
        let delta = 0;
        let text = "成功！";
        let result = "success";

        if (move === "heavy") {
            if (bm._pbsTimer <= PBS.PERFECT_WINDOW) {
                result = "perfect";
                delta = p.heavyPerfect;
                text = "完美格擋！";
            } else {
                delta = p.heavySuccess;
                text = "格擋成功！";
            }
        } else if (move === "sweep") {
            delta = p.sweepSuccess;
            text = "閃避成功！";
        } else if (move === "thrust") {
            delta = p.thrustSuccess;
            text = "反擊成功！";
            PBS.doCounter(bm); // 突刺成功 → 反擊敵人
        }

        bm._pbsOutcome = { move: move, result: result };
        PBS.playSe(p.successSe);
        PBS.beginResult(bm, text);
        // 成功 → 戰線增加 (達 100 會在此觸發破防，目標為發動攻擊的敵人)
        PBS.applyPressureDelta(bm, delta, {
            breakEnemy: bm._pbsAttacker,
            crisisActor: bm._pbsTargetActor,
        });
    };

    PBS.resolveFail = function (bm) {
        const move = bm._pbsMove;
        const p = PBS.params;
        let delta = 0;
        let text = "失敗！";

        if (move === "sweep") {
            delta = p.sweepFail;
            text = "閃避失敗！";
        } else if (move === "heavy") {
            delta = p.heavyFail;
            text = "格擋失敗！";
        } else if (move === "thrust") {
            delta = p.thrustFail;
            text = "反擊失敗！";
        }

        bm._pbsOutcome = { move: move, result: "fail" };
        PBS.playSe(p.failSe);
        PBS.beginResult(bm, text);
        // 失敗 → 戰線減少 (達 0 會在此觸發危機，目標為被攻擊的角色)
        PBS.applyPressureDelta(bm, delta, {
            breakEnemy: bm._pbsAttacker,
            crisisActor: bm._pbsTargetActor,
        });
    };

    PBS.doCounter = function (bm) {
        const enemy = bm._pbsAttacker;
        const actor = bm._pbsTargetActor || PBS.firstAliveActor();
        if (enemy && enemy.isAlive && enemy.isAlive()) {
            const value = PBS.counterDamage(actor, enemy);
            PBS.dealDirectDamage(enemy, value);
        }
    };

    // 每幀的全域更新 (在 Scene_Battle.update 內呼叫) — 負責結果文字計時
    PBS.updateGlobal = function () {
        const bm = BattleManager;
        if (bm && bm._pbsResultTimer > 0) {
            bm._pbsResultTimer--;
        }
    };

    //=========================================================================
    // BattleManager 別名 (不重寫，只掛勾)
    //=========================================================================
    const _BM_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function () {
        _BM_initMembers.call(this);
        // 戰線值與 QTE 狀態初始化
        this._pressureValue = PBS.params.initialPressure;
        this._pbsPhase = "idle";        // idle / active / result
        this._pbsPendingMove = null;    // 本次敵人行動要觸發的招式
        this._pbsDone = false;          // QTE 是否已完成 (準備放行原生流程)
        this._pbsMove = null;
        this._pbsTimer = 0;
        this._pbsTimerMax = 0;
        this._pbsResultText = "";
        this._pbsResultTimer = 0;
        this._pbsOutcome = null;        // 給傷害修正用的結果
        this._pbsAttacker = null;       // 發動攻擊的敵人
        this._pbsTargetActor = null;    // 被攻擊的角色
        this._pbsPower = 0;             // 敵人壓迫力量 (失敗時追加傷害)
    };

    const _BM_startAction = BattleManager.startAction;
    BattleManager.startAction = function () {
        _BM_startAction.call(this);

        // 每次行動先重置 QTE 旗標
        this._pbsOutcome = null;
        this._pbsDone = false;
        this._pbsPendingMove = null;

        const subject = this._subject;
        const action = this._action;
        const offensive =
            action &&
            action.isForOpponent() &&
            action.checkDamageType([1, 2, 5, 6]); // HP/MP 傷害或吸收

        if (subject && subject.isEnemy() && offensive) {
            // 安排一次壓境操作階段
            this._pbsPendingMove = PBS.pickMove(subject);
            this._pbsAttacker = subject;
            this._pbsPower = PBS.enemyPower(subject);
            this._pbsTimerMax = PBS.enemySpeed(subject);
            // 取得被攻擊的角色 (取第一個我方目標，沒有則隊長)
            const actorTarget =
                this._targets && this._targets.find((t) => t.isActor());
            this._pbsTargetActor = actorTarget || PBS.firstAliveActor();
        }
    };

    const _BM_updateAction = BattleManager.updateAction;
    BattleManager.updateAction = function () {
        // 只有敵人攻擊且尚未完成 QTE 時，才介入。
        // 注意：updateAction 只會在行動動畫播完(logWindow 不忙)後每幀執行，
        // 因此此時插入 QTE 不會卡住動畫，並且會在套用傷害「之前」。
        if (this._pbsPendingMove) {
            if (this._pbsPhase === "idle" && !this._pbsDone) {
                PBS.startReaction(this);
            }
            if (this._pbsPhase === "active" || this._pbsPhase === "result") {
                PBS.updateReaction(this);
                return; // 阻擋原生流程，等待 QTE 結束
            }
            if (this._pbsDone) {
                // QTE 完成，放行；傷害會由 executeDamage 依 _pbsOutcome 修正
                this._pbsPendingMove = null;
                this._pbsDone = false;
            }
        }
        _BM_updateAction.call(this);
    };

    const _BM_endAction = BattleManager.endAction;
    BattleManager.endAction = function () {
        // 在原生清除 _action 之前，先處理玩家技能的戰線推進
        const subject = this._subject;
        const action = this._action;
        if (subject && subject.isActor && subject.isActor() && action) {
            const push = PBS.skillPush(action.item());
            if (push !== 0) {
                const enemy = PBS._lastActorEnemyTarget || PBS.firstAliveEnemy();
                PBS.applyPressureDelta(this, push, {
                    breakEnemy: enemy,
                    crisisActor: subject,
                });
            }
        }
        _BM_endAction.call(this);
        this._pbsOutcome = null; // 行動結束清除結果
    };

    //=========================================================================
    // Game_Action 別名 — 依 QTE 結果與破防狀態修正傷害
    //=========================================================================
    const _GA_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function (target, value) {
        value = PBS.modifyDamage(this, target, value);
        _GA_executeDamage.call(this, target, value);

        // 玩家攻擊破防敵人後消耗破防 (只加成下一擊)
        if (PBS._consumeBreak && PBS._consumeBreak === target) {
            PBS.consumeBreak(target);
            PBS._consumeBreak = null;
        }
    };

    PBS.modifyDamage = function (action, target, value) {
        const subject = action.subject();
        const bm = BattleManager;

        // (1) 敵人攻擊我方角色，且本次行動有 QTE 結果
        if (subject && subject.isEnemy() && target.isActor()) {
            if (action === bm._action && bm._pbsOutcome) {
                const o = bm._pbsOutcome;
                if (o.result === "perfect") {
                    return 0; // 完美格擋 → 不受傷
                }
                if (o.result === "success") {
                    if (o.move === "sweep" || o.move === "thrust") {
                        return 0; // 閃避 / 反擊 → 不受傷
                    }
                    if (o.move === "heavy") {
                        return Math.floor(value * PBS.HEAVY_GUARD_RATE); // 格擋 → 減傷
                    }
                }
                if (o.result === "fail") {
                    // 失敗 → 完整傷害 + 敵人壓迫力量追加
                    return value + (bm._pbsPower || 0);
                }
            }
        }

        // (2) 玩家攻擊敵人；記錄最後攻擊的敵人 (給 PressurePush 破防歸屬用)
        if (subject && subject.isActor() && target.isEnemy()) {
            PBS._lastActorEnemyTarget = target;

            if (target._pbsBroken) {
                const skillBonus = PBS.skillBreakBonus(action.item());
                const rate = skillBonus != null ? skillBonus : PBS.params.breakDamageRate;
                value = Math.floor(value * rate);
                PBS._consumeBreak = target; // 標記此擊後消耗破防
            }
        }

        return value;
    };

    //=========================================================================
    // UI：Sprite_PressureHud
    // 包含：戰線條 / 戰線指標 / 操作提示文字 / 倒數時間條 / 結果文字
    //=========================================================================
    function Sprite_PressureHud() {
        this.initialize(...arguments);
    }
    Sprite_PressureHud.prototype = Object.create(Sprite.prototype);
    Sprite_PressureHud.prototype.constructor = Sprite_PressureHud;

    Sprite_PressureHud.prototype.initialize = function () {
        Sprite.prototype.initialize.call(this);
        this._lastValue = -1;
        this._lastMove = null;
        this._lastResult = null;
        this.createGaugeSprite();
        this.createCountdownSprite();
        this.createPromptSprite();
        this.createResultSprite();
    };

    // --- 戰線條 (含指標 / 數值 / 兩端標籤) --------------------------------
    Sprite_PressureHud.prototype.createGaugeSprite = function () {
        const p = PBS.params;
        const sprite = new Sprite();
        // 高度多留 24px 給數值與兩端文字
        sprite.bitmap = new Bitmap(p.gaugeWidth, p.gaugeHeight + 24);
        sprite.x = p.gaugeX;
        sprite.y = p.gaugeY;
        this._gaugeSprite = sprite;
        this.addChild(sprite);
    };

    Sprite_PressureHud.prototype.drawGauge = function (value) {
        const p = PBS.params;
        const w = p.gaugeWidth;
        const h = p.gaugeHeight;
        const bmp = this._gaugeSprite.bitmap;
        const rate = Math.max(0, Math.min(1, value / p.maxPressure));

        bmp.clear();

        // 背景底框
        bmp.fillRect(0, 0, w, h, "rgba(0,0,0,0.6)");

        // 依比例選色：低=危機紅、中=金、高=破防青
        let c1, c2;
        if (rate <= 0.25) {
            c1 = "#7a1f1f"; c2 = "#e23b3b";
        } else if (rate >= 0.85) {
            c1 = "#1f5a7a"; c2 = "#3bd0e2";
        } else {
            c1 = "#7a6a1f"; c2 = "#e2c83b";
        }
        const fillW = Math.floor((w - 4) * rate);
        if (fillW > 0) {
            bmp.gradientFillRect(2, 2, fillW, h - 4, c1, c2);
        }

        // 中央 (50%) 刻度線
        bmp.fillRect(Math.floor(w / 2) - 1, 0, 2, h, "rgba(255,255,255,0.6)");

        // 目前戰線指標 (一條亮白線)
        const markX = Math.max(0, Math.min(w - 2, Math.floor((w - 2) * rate)));
        bmp.fillRect(markX, -2, 3, h + 4, "#ffffff");

        // 邊框
        bmp.fillRect(0, 0, w, 2, "rgba(255,255,255,0.4)");
        bmp.fillRect(0, h - 2, w, 2, "rgba(255,255,255,0.4)");

        // 數值文字 (置中於條下方)
        bmp.fontSize = 18;
        bmp.textColor = "#ffffff";
        bmp.outlineColor = "rgba(0,0,0,0.8)";
        bmp.outlineWidth = 4;
        bmp.drawText(Math.round(value) + " / " + p.maxPressure, 0, h, w, 24, "center");

        // 兩端標籤
        bmp.fontSize = 14;
        bmp.drawText("危機", 4, h, 80, 24, "left");
        bmp.drawText("破防", w - 84, h, 80, 24, "right");
    };

    Sprite_PressureHud.prototype.updateGauge = function () {
        const value = BattleManager._pressureValue || 0;
        if (value !== this._lastValue) {
            this._lastValue = value;
            this.drawGauge(value);
        }
    };

    // --- 倒數時間條 --------------------------------------------------------
    Sprite_PressureHud.prototype.createCountdownSprite = function () {
        const p = PBS.params;
        const sprite = new Sprite();
        sprite.bitmap = new Bitmap(p.gaugeWidth, 10);
        sprite.x = p.gaugeX;
        sprite.y = p.gaugeY - 18;
        sprite.visible = false;
        this._countdownSprite = sprite;
        this.addChild(sprite);
    };

    Sprite_PressureHud.prototype.updateCountdown = function () {
        const bm = BattleManager;
        const sprite = this._countdownSprite;
        if (bm._pbsPhase === "active" && bm._pbsTimerMax > 0) {
            sprite.visible = true;
            const w = PBS.params.gaugeWidth;
            const rate = Math.max(0, Math.min(1, bm._pbsTimer / bm._pbsTimerMax));
            const bmp = sprite.bitmap;
            bmp.clear();
            bmp.fillRect(0, 0, w, 10, "rgba(0,0,0,0.6)");
            // 時間越少越紅
            const c1 = rate > 0.4 ? "#3be25a" : "#e2c83b";
            const c2 = rate > 0.4 ? "#c8e23b" : "#e23b3b";
            bmp.gradientFillRect(1, 1, Math.floor((w - 2) * rate), 8, c1, c2);
        } else {
            sprite.visible = false;
        }
    };

    // --- 操作提示文字 ------------------------------------------------------
    Sprite_PressureHud.prototype.createPromptSprite = function () {
        const sprite = new Sprite();
        sprite.bitmap = new Bitmap(Graphics.width, 44);
        sprite.x = 0;
        sprite.y = PBS.params.gaugeY - 78;
        sprite.visible = false;
        this._promptSprite = sprite;
        this.addChild(sprite);
    };

    Sprite_PressureHud.prototype.promptText = function (move) {
        switch (move) {
            case "sweep":  return "橫掃來襲！按 ← 或 → 閃避！";
            case "heavy":  return "重擊來襲！按 Z 格擋！（抓準時機可完美格擋）";
            case "thrust": return "突刺來襲！按 X 反擊！";
        }
        return "";
    };

    Sprite_PressureHud.prototype.updatePrompt = function () {
        const bm = BattleManager;
        const sprite = this._promptSprite;
        if (bm._pbsPhase === "active") {
            sprite.visible = true;
            if (bm._pbsMove !== this._lastMove) {
                this._lastMove = bm._pbsMove;
                const bmp = sprite.bitmap;
                bmp.clear();
                bmp.fontSize = 26;
                bmp.textColor = "#ffe9a0";
                bmp.outlineColor = "rgba(0,0,0,0.9)";
                bmp.outlineWidth = 5;
                bmp.drawText(this.promptText(bm._pbsMove), 0, 0, Graphics.width, 44, "center");
            }
        } else {
            sprite.visible = false;
            this._lastMove = null;
        }
    };

    // --- 結果文字 ----------------------------------------------------------
    Sprite_PressureHud.prototype.createResultSprite = function () {
        const sprite = new Sprite();
        sprite.bitmap = new Bitmap(Graphics.width, 64);
        sprite.x = 0;
        sprite.y = Math.floor(Graphics.height * 0.32);
        sprite.visible = false;
        this._resultSprite = sprite;
        this.addChild(sprite);
    };

    Sprite_PressureHud.prototype.updateResult = function () {
        const bm = BattleManager;
        const sprite = this._resultSprite;
        if (bm._pbsResultTimer > 0 && bm._pbsResultText) {
            sprite.visible = true;
            if (bm._pbsResultText !== this._lastResult) {
                this._lastResult = bm._pbsResultText;
                const bmp = sprite.bitmap;
                bmp.clear();
                bmp.fontSize = 40;
                bmp.textColor = "#ffffff";
                bmp.outlineColor = "rgba(0,0,0,0.9)";
                bmp.outlineWidth = 6;
                bmp.drawText(bm._pbsResultText, 0, 0, Graphics.width, 64, "center");
            }
            // 最後 15 幀淡出
            sprite.opacity = bm._pbsResultTimer < 15
                ? Math.floor((bm._pbsResultTimer / 15) * 255)
                : 255;
        } else {
            sprite.visible = false;
            sprite.opacity = 255;
            this._lastResult = null;
        }
    };

    Sprite_PressureHud.prototype.update = function () {
        Sprite.prototype.update.call(this);
        if (!$gameParty || !$gameParty.inBattle()) {
            this.visible = false;
            return;
        }
        this.visible = true;
        this.updateGauge();
        this.updateCountdown();
        this.updatePrompt();
        this.updateResult();
    };

    //=========================================================================
    // Scene_Battle 別名 — 建立 HUD 並驅動全域更新
    //=========================================================================
    const _SB_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function () {
        _SB_createAllWindows.call(this);
        this.createPressureHud();
    };

    Scene_Battle.prototype.createPressureHud = function () {
        this._pressureHud = new Sprite_PressureHud();
        // 加在視窗之上，但 HUD 內元件已避開底部指令視窗位置
        this.addChild(this._pressureHud);
    };

    const _SB_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        _SB_update.call(this);
        PBS.updateGlobal();
    };

})();
