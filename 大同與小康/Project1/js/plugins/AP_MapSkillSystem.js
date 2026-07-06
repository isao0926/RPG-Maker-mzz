/*:
 * @target MZ
 * @plugindesc 地圖技能與冷卻 UI 系統 v2.0 — 按鍵直接施放地圖技能（裝備制），左下角顯示冷卻與狀態，可更換裝備技能。
 * @author AI Peak
 *
 * @help
 * ============================================================================
 * 【AP_MapSkillSystem 地圖技能與冷卻 UI 系統 v2.0】
 * ============================================================================
 *
 * 動作手感版：每位角色同時只「裝備」一個地圖技能，在地圖上按下攻擊鍵
 * （預設 J）即可直接施放，無須開菜單。左下角常駐顯示目前裝備的技能與
 * 冷卻倒數，以及生效中狀態的剩餘步數/回合。
 *
 * 技能行為（沿用資料庫系統）：
 *   ‧ 狀態賦予（隱匿、加速…）      ‧ 地圖攻擊（用技能傷害公式打怪物事件）
 *   ‧ 觸發公共事件
 *
 * ----------------------------------------------------------------------------
 * ● 操作方式
 * ----------------------------------------------------------------------------
 *   攻擊鍵（預設 J）：施放「隊長目前裝備的地圖技能」。
 *   切換鍵（預設 K）：在隊長已學會的地圖技能之間循環切換裝備。
 *   開菜單 → 技能 → 點某個地圖技能：把它「裝備」給該角色（不會立刻施放）。
 *
 *   簡言之：用「菜單／K 鍵」決定要用哪招，用「J 鍵」把它打出去。
 *
 * ----------------------------------------------------------------------------
 * ● 安裝與命名
 * ----------------------------------------------------------------------------
 * 檔名請維持 AP_MapSkillSystem.js，放入 js/plugins/ 並於插件管理器啟用。
 * 要能在菜單被選取的技能，其「使用時機」須設為【總是】或【菜單畫面】。
 *
 * ----------------------------------------------------------------------------
 * ● 怪物事件備忘錄（Note）標籤
 * ----------------------------------------------------------------------------
 *   <Enemy>          標記為怪物（公式中的 b 退回以施放者代入）
 *   <Enemy: 3>       標記為怪物並連結資料庫敵人 3（供 b.def 等使用）
 *   <HP: 100>        此事件的地圖生命值（未填預設 1）
 * HP 歸零時會依參數自動開啟該事件「獨立開關 A」／消除事件。
 *
 * ----------------------------------------------------------------------------
 * ● 插件命令
 * ----------------------------------------------------------------------------
 *   施放地圖技能 useMapSkill：直接讓指定角色施放某地圖技能（吃冷卻與消耗）。
 *   更換裝備技能 setMapSkill：把指定角色的裝備技能換成某地圖技能。
 *
 * ----------------------------------------------------------------------------
 * ● 相容性
 * ----------------------------------------------------------------------------
 * 不修改 Game_Actor.prototype.useItem；一般技能/道具菜單流程完全不受影響。
 *
 * @command useMapSkill
 * @text 施放地圖技能
 * @desc 直接讓指定角色施放某個地圖技能（仍會檢查冷卻與消耗）。
 * @arg skillId
 * @text 技能 ID
 * @type skill
 * @default 0
 * @arg actorId
 * @text 施放者角色 ID
 * @type actor
 * @default 0
 * @desc 0 = 使用當前隊長。
 *
 * @command setMapSkill
 * @text 更換裝備技能
 * @desc 更換某角色目前裝備的地圖技能（供 NPC / 事件切換用）。
 * @arg skillId
 * @text 技能 ID
 * @type skill
 * @default 0
 * @arg actorId
 * @text 角色 ID
 * @type actor
 * @default 0
 * @desc 0 = 當前隊長。
 *
 *
 * @param attackKey
 * @text 攻擊鍵（施放）
 * @type string
 * @default J
 * @desc 在地圖上施放「裝備中技能」的按鍵，填單一英文字母（A~Z）。
 *
 * @param cycleKey
 * @text 切換鍵（換技能）
 * @type string
 * @default K
 * @desc 在地圖上循環切換裝備技能的按鍵，填單一英文字母；留空 = 不使用。
 *
 * @param ignoreCost
 * @text 空放時忽略 MP/TP 消耗
 * @type boolean
 * @on 不消耗（可自由空揮）
 * @off 照常消耗
 * @default false
 * @desc 開啟後，地圖上按鍵施放不檢查也不扣除 MP/TP，僅受「冷卻」與「是否學會」限制。
 *
 * @param mapSkills
 * @text 地圖技能列表
 * @type struct<MapSkill>[]
 * @default []
 * @desc 在此新增每一個「地圖技能」及其行為設定。
 *
 * @param stealthStates
 * @text 隱匿狀態 ID 列表
 * @type state[]
 * @default []
 * @desc 只要隊長帶有此清單中任一狀態，即視為「隱匿中」（影響遇敵與追擊）。
 *
 * @param stopChase
 * @text 隱匿時停止小怪追擊
 * @type boolean
 * @on 停止追擊
 * @off 照常追擊
 * @default true
 *
 * @param zeroEncounter
 * @text 隱匿時遇敵率歸零
 * @type boolean
 * @on 不會遇敵
 * @off 照常遇敵
 * @default true
 *
 * @param stealthSwitchId
 * @text 隱匿狀態同步開關 ID
 * @type switch
 * @default 0
 * @desc 隱匿中自動開啟、結束自動關閉此開關，方便自製事件 AI 判斷。0 = 不使用。
 *
 * @param stateTarget
 * @text 狀態賦予對象
 * @type select
 * @option 施放者
 * @value caster
 * @option 隊長
 * @value leader
 * @option 全隊
 * @value all
 * @default leader
 *
 * @param eraseOnDeath
 * @text 怪物死亡時消除事件
 * @type boolean
 * @default true
 *
 * @param selfSwitchOnDeath
 * @text 怪物死亡時開啟獨立開關 A
 * @type boolean
 * @default true
 *
 * @param attackAnimOnEnemy
 * @text 地圖攻擊時對怪物播放動畫
 * @type boolean
 * @default true
 *
 * @param showDamagePopup
 * @text 顯示地圖傷害數字
 * @type boolean
 * @default true
 *
 * @param hudEnabled
 * @text 顯示左下角 HUD
 * @type boolean
 * @default true
 *
 * @param hideHudInMessage
 * @text 對話中隱藏 HUD
 * @type boolean
 * @default true
 *
 * @param hudX
 * @text HUD 水平微調
 * @type number
 * @min -400
 * @default 0
 *
 * @param hudY
 * @text HUD 垂直微調
 * @type number
 * @min -400
 * @default 0
 */

/*~struct~MapSkill:
 * @param skillId
 * @text 技能 ID
 * @type skill
 * @default 0
 * @desc 對應資料庫的技能編號。
 *
 * @param animationId
 * @text 內建動畫 ID
 * @type animation
 * @default 0
 * @desc 施放時在玩家頭上播放的內建動畫。0 = 不播放。
 *
 * @param cooldown
 * @text 冷卻時間（秒）
 * @type number
 * @decimals 1
 * @min 0
 * @default 3.0
 * @desc 施放後需等待的秒數。0 = 無冷卻（左下角就不會顯示倒數）。
 *
 * @param skillType
 * @text 技能類型
 * @type select
 * @option 狀態賦予
 * @value state
 * @option 地圖攻擊
 * @value attack
 * @option 公共事件
 * @value common
 * @default state
 *
 * @param stateId
 * @text 賦予狀態 ID（狀態賦予用）
 * @type state
 * @default 0
 *
 * @param stateSteps
 * @text 狀態持續步數（狀態賦予用）
 * @type number
 * @min 0
 * @default 0
 * @desc >0 時由本插件依步數倒數並歸零移除狀態；=0 時沿用資料庫狀態自身的自動解除。
 *
 * @param range
 * @text 影響格數（地圖攻擊用）
 * @type number
 * @min 1
 * @default 1
 *
 * @param commonEventId
 * @text 公共事件 ID（公共事件用）
 * @type common_event
 * @default 0
 */

(() => {
    "use strict";

    const PLUGIN_NAME = decodeURIComponent(document.currentScript.src)
        .match(/([^/]+)\.js$/)[1];

    // ------------------------------------------------------------------------
    // 參數解析
    // ------------------------------------------------------------------------
    const raw = PluginManager.parameters(PLUGIN_NAME);
    const toBool = (v, def) => (v === undefined || v === "" ? def : v === "true");
    const parseStruct = (str) => { try { return JSON.parse(str); } catch (e) { return {}; } };

    const MAP_SKILLS = JSON.parse(raw["mapSkills"] || "[]").map((s) => {
        const o = parseStruct(s);
        return {
            skillId: Number(o.skillId || 0),
            animationId: Number(o.animationId || 0),
            cooldown: Number(o.cooldown || 0),
            skillType: String(o.skillType || "state"),
            stateId: Number(o.stateId || 0),
            stateSteps: Number(o.stateSteps || 0),
            range: Math.max(1, Number(o.range || 1)),
            commonEventId: Number(o.commonEventId || 0),
        };
    });

    const STEALTH_STATES = JSON.parse(raw["stealthStates"] || "[]").map(Number);

    const P = {
        attackKey: String(raw["attackKey"] || "J"),
        cycleKey: String(raw["cycleKey"] || "K"),
        ignoreCost: toBool(raw["ignoreCost"], false),
        stopChase: toBool(raw["stopChase"], true),
        zeroEncounter: toBool(raw["zeroEncounter"], true),
        stealthSwitchId: Number(raw["stealthSwitchId"] || 0),
        stateTarget: String(raw["stateTarget"] || "leader"),
        eraseOnDeath: toBool(raw["eraseOnDeath"], true),
        selfSwitchOnDeath: toBool(raw["selfSwitchOnDeath"], true),
        attackAnimOnEnemy: toBool(raw["attackAnimOnEnemy"], true),
        showDamagePopup: toBool(raw["showDamagePopup"], true),
        hudEnabled: toBool(raw["hudEnabled"], true),
        hideHudInMessage: toBool(raw["hideHudInMessage"], true),
        hudX: Number(raw["hudX"] || 0),
        hudY: Number(raw["hudY"] || 0),
    };

    // 將單一英文字母對應為 Input 名稱（A~Z → keyCode 65~90）
    const KEY_ATTACK = "apMapAtk";
    const KEY_CYCLE = "apMapCycle";
    const mapLetterKey = (letter, name) => {
        if (!letter) return;
        const c = String(letter).trim().toUpperCase();
        if (c.length === 1 && c >= "A" && c <= "Z") {
            Input.keyMapper[c.charCodeAt(0)] = name;
        }
    };
    mapLetterKey(P.attackKey, KEY_ATTACK);
    mapLetterKey(P.cycleKey, KEY_CYCLE);

    // ========================================================================
    // 核心管理器（可存檔資料放在 $gameSystem / 角色 / $gameTemp）
    // ========================================================================
    const MapSkill = {
        allConfigs() { return MAP_SKILLS; },
        config(skillId) { return MAP_SKILLS.find((c) => c.skillId === skillId) || null; },
        isMapSkill(skillId) { return !!this.config(skillId); },

        // 取得某角色「已學會」的地圖技能清單（可供裝備/切換）
        learnedMapSkills(actor) {
            if (!actor) return [];
            return MAP_SKILLS
                .map((c) => c.skillId)
                .filter((id) => $dataSkills[id] && actor.isLearnedSkill(id));
        },

        // --- 冷卻（幀為單位，60 幀 = 1 秒；存於 $gameSystem）---
        cooldowns() {
            if (!$gameSystem._mapSkillCooldowns) $gameSystem._mapSkillCooldowns = {};
            return $gameSystem._mapSkillCooldowns;
        },
        startCooldown(skillId) {
            const cfg = this.config(skillId);
            if (!cfg) return;
            const frames = Math.round((cfg.cooldown || 0) * 60);
            if (frames > 0) this.cooldowns()[skillId] = frames;
        },
        isOnCooldown(skillId) { return (this.cooldowns()[skillId] || 0) > 0; },
        cooldownSeconds(skillId) { return Math.ceil((this.cooldowns()[skillId] || 0) / 60); },
        updateCooldown() {
            const cds = this.cooldowns();
            for (const id in cds) {
                if (cds[id] > 0) { cds[id]--; if (cds[id] <= 0) delete cds[id]; }
            }
        },

        // --- 狀態步數計時器 ---
        stateTimers() {
            if (!$gameSystem._mapSkillStateTimers) $gameSystem._mapSkillStateTimers = [];
            return $gameSystem._mapSkillStateTimers;
        },
        setStateStepTimer(actorId, stateId, steps) {
            const timers = this.stateTimers();
            const found = timers.find((t) => t.actorId === actorId && t.stateId === stateId);
            if (found) found.steps = steps;
            else timers.push({ actorId, stateId, steps });
        },

        // --- 隱匿判定 ---
        isStealthActive() {
            const leader = $gameParty.leader();
            if (!leader) return false;
            return STEALTH_STATES.some((id) => leader.isStateAffected(id));
        },
        refreshStealthSwitch() {
            if (P.stealthSwitchId > 0) {
                $gameSwitches.setValue(P.stealthSwitchId, this.isStealthActive());
            }
        },

        stateTargets(caster) {
            switch (P.stateTarget) {
                case "caster": return caster ? [caster] : [$gameParty.leader()];
                case "all": return $gameParty.battleMembers();
                case "leader":
                default: return [$gameParty.leader()];
            }
        },

        // 每一步：狀態步數倒數 + 開關同步
        onPlayerStep() {
            const timers = this.stateTimers();
            for (let i = timers.length - 1; i >= 0; i--) {
                const t = timers[i];
                const actor = $gameActors.actor(t.actorId);
                if (!actor || !actor.isStateAffected(t.stateId)) { timers.splice(i, 1); continue; }
                t.steps -= 1;
                if (t.steps <= 0) { actor.removeState(t.stateId); timers.splice(i, 1); }
            }
            this.refreshStealthSwitch();
        },

        stateRemainingText(stateId) {
            const timer = this.stateTimers().find((t) => t.stateId === stateId);
            if (timer) return timer.steps + "步";
            for (const m of $gameParty.battleMembers()) {
                if (m.isStateAffected(stateId)) {
                    const turns = m._stateTurns ? m._stateTurns[stateId] : undefined;
                    if (Number.isFinite(turns) && turns > 0) return turns + "回";
                }
            }
            return "";
        },
        stateActiveOnParty(stateId) {
            return $gameParty.battleMembers().some((m) => m.isStateAffected(stateId));
        },

        // ====================================================================
        // 施放主流程
        // ====================================================================
        executeMapSkill(skillId, actorId) {
            const cfg = this.config(skillId);
            if (!cfg) return;
            const actor = $gameActors.actor(actorId) || $gameParty.leader();
            if (cfg.animationId > 0) $gameTemp.requestAnimation([$gamePlayer], cfg.animationId);
            switch (cfg.skillType) {
                case "state": this.applyStateSkill(cfg, actor); break;
                case "attack": this.applyAttackSkill(cfg, actor); break;
                case "common":
                    if (cfg.commonEventId > 0) $gameTemp.reserveCommonEvent(cfg.commonEventId);
                    break;
            }
        },

        applyStateSkill(cfg, caster) {
            if (cfg.stateId <= 0) return;
            for (const t of this.stateTargets(caster)) {
                if (!t) continue;
                t.addState(cfg.stateId);
                if (cfg.stateSteps > 0) this.setStateStepTimer(t.actorId(), cfg.stateId, cfg.stateSteps);
            }
            this.refreshStealthSwitch();
        },

        applyAttackSkill(cfg, caster) {
            const skill = $dataSkills[cfg.skillId];
            if (!skill) return;
            const targets = this.eventsInFront(cfg.range).filter((ev) => this.isEnemyEvent(ev));
            for (const ev of targets) {
                this.ensureEventHp(ev);
                const dmg = this.calcDamage(cfg.skillId, caster, this.eventEnemyId(ev));
                ev._mapHp -= dmg;
                if (P.attackAnimOnEnemy && cfg.animationId > 0) $gameTemp.requestAnimation([ev], cfg.animationId);
                if (P.showDamagePopup) this.showDamagePopup(ev, dmg);
                if (ev._mapHp <= 0) this.killEnemyEvent(ev);
            }
        },

        eventsInFront(range) {
            const d = $gamePlayer.direction();
            const results = [];
            let x = $gamePlayer.x, y = $gamePlayer.y;
            for (let i = 1; i <= range; i++) {
                x = $gameMap.roundXWithDirection(x, d);
                y = $gameMap.roundYWithDirection(y, d);
                for (const ev of $gameMap.eventsXy(x, y)) results.push(ev);
            }
            return results;
        },

        isEnemyEvent(ev) {
            if (!ev || ev._erased || !ev.event()) return false;
            return /<Enemy(?::\s*\d+)?>/i.test(ev.event().note);
        },
        eventEnemyId(ev) {
            const m = ev.event().note.match(/<Enemy:\s*(\d+)>/i);
            return m ? Number(m[1]) : 0;
        },
        ensureEventHp(ev) {
            if (ev._mapHp === undefined) {
                const m = ev.event().note.match(/<HP:\s*(\d+)>/i);
                ev._mapHp = m ? Number(m[1]) : 1;
            }
        },

        calcDamage(skillId, subject, enemyId) {
            const action = new Game_Action(subject);
            action.setSkill(skillId);
            let target = subject;
            if (enemyId && $dataEnemies[enemyId]) target = new Game_Enemy(enemyId, 0, 0);
            let value = action.evalDamageFormula(target);
            value = action.applyVariance(value, action.item().damage.variance);
            return Math.max(0, Math.floor(value));
        },

        killEnemyEvent(ev) {
            if (P.selfSwitchOnDeath) {
                $gameSelfSwitches.setValue([$gameMap.mapId(), ev.eventId(), "A"], true);
            }
            if (P.eraseOnDeath) ev.erase();
        },

        showDamagePopup(character, value) {
            const scene = SceneManager._scene;
            if (!scene || !scene._spriteset) return;
            scene._spriteset.addChild(new Sprite_MapDamage(value, character));
        },
    };

    window.$mapSkillManager = MapSkill;

    // ========================================================================
    // 插件命令
    // ========================================================================
    PluginManager.registerCommand(PLUGIN_NAME, "useMapSkill", (args) => {
        const skillId = Number(args.skillId || 0);
        const actor = Number(args.actorId || 0) > 0 ? $gameActors.actor(Number(args.actorId)) : $gameParty.leader();
        if (!actor || !MapSkill.config(skillId)) return;
        if (MapSkill.isOnCooldown(skillId)) { SoundManager.playBuzzer(); return; }
        const skill = $dataSkills[skillId];
        if (!P.ignoreCost) {
            if (!actor.canUse(skill)) { SoundManager.playBuzzer(); return; }
            actor.paySkillCost(skill);
        }
        MapSkill.startCooldown(skillId);
        $gameTemp.reserveMapSkill(skillId, actor.actorId());
    });

    PluginManager.registerCommand(PLUGIN_NAME, "setMapSkill", (args) => {
        const skillId = Number(args.skillId || 0);
        const actor = Number(args.actorId || 0) > 0 ? $gameActors.actor(Number(args.actorId)) : $gameParty.leader();
        if (actor && MapSkill.isMapSkill(skillId)) actor.setMapSkillId(skillId);
    });

    // ========================================================================
    // Game_Actor：每位角色「裝備中的地圖技能」
    // ========================================================================
    Game_Actor.prototype.mapSkillId = function () {
        // 已指定且仍是有效地圖技能 → 直接回傳
        if (this._mapSkillId && MapSkill.isMapSkill(this._mapSkillId)) return this._mapSkillId;
        // 尚未指定：預設為此角色已學會的第一個地圖技能
        const learned = MapSkill.learnedMapSkills(this);
        if (learned.length) return (this._mapSkillId = learned[0]);
        const all = MapSkill.allConfigs();
        return (this._mapSkillId = all.length ? all[0].skillId : 0);
    };
    Game_Actor.prototype.setMapSkillId = function (id) {
        this._mapSkillId = id;
    };

    // ========================================================================
    // Game_Temp：待施放的地圖技能（不需存檔）
    // ========================================================================
    Game_Temp.prototype.reserveMapSkill = function (skillId, actorId) {
        this._pendingMapSkill = { skillId, actorId };
    };
    Game_Temp.prototype.pendingMapSkill = function () { return this._pendingMapSkill; };
    Game_Temp.prototype.clearPendingMapSkill = function () { this._pendingMapSkill = null; };

    // ========================================================================
    // Scene_Skill：在菜單選取地圖技能 → 改為「裝備」該技能（不立即施放）
    // ========================================================================
    const _Scene_Skill_onItemOk = Scene_Skill.prototype.onItemOk;
    Scene_Skill.prototype.onItemOk = function () {
        const skill = this.item();
        if (skill && MapSkill.isMapSkill(skill.id)) {
            this.actor().setMapSkillId(skill.id); // 裝備
            SoundManager.playEquip();
            this._itemWindow.refresh();           // 重繪以更新裝備標記
            this._itemWindow.activate();
            return;
        }
        _Scene_Skill_onItemOk.call(this);
    };

    // 在技能清單中，替「目前裝備的地圖技能」標上箭頭
    const _Window_SkillList_drawItem = Window_SkillList.prototype.drawItem;
    Window_SkillList.prototype.drawItem = function (index) {
        _Window_SkillList_drawItem.call(this, index);
        const skill = this.itemAt(index);
        if (skill && this._actor && MapSkill.isMapSkill(skill.id) &&
            this._actor.mapSkillId() === skill.id) {
            const rect = this.itemLineRect(index);
            this.changeTextColor(ColorManager.powerUpColor());
            this.drawText("\u25B6", rect.x, rect.y, rect.width, "right"); // ▶
            this.resetTextColor();
        }
    };

    // ========================================================================
    // Scene_Map：按鍵施放/切換、冷卻倒數、待施放執行、HUD
    // ========================================================================
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        _Scene_Map_start.call(this);
        MapSkill.refreshStealthSwitch();
    };

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function () {
        _Scene_Map_createAllWindows.call(this);
        if (P.hudEnabled) {
            this._mapSkillHud = new Sprite_MapSkillHud();
            this.addChild(this._mapSkillHud);
        }
    };

    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this);
        MapSkill.updateCooldown();
        this.updatePendingMapSkill();
        this.updateMapSkillInput();
    };

    // 是否允許此刻接收地圖技能按鍵
    Scene_Map.prototype.isMapSkillInputActive = function () {
        return this.isActive() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() &&
            !$gamePlayer.isTransferring() && $gamePlayer.canMove() && !$gameTemp.pendingMapSkill();
    };

    Scene_Map.prototype.updateMapSkillInput = function () {
        if (!this.isMapSkillInputActive()) return;
        if (Input.isTriggered(KEY_ATTACK)) this.castLeaderMapSkill();
        else if (P.cycleKey && Input.isTriggered(KEY_CYCLE)) this.cycleLeaderMapSkill();
    };

    // 按攻擊鍵：施放隊長裝備中的地圖技能（空放也算：不論前方有無怪都會進冷卻並播動畫）
    Scene_Map.prototype.castLeaderMapSkill = function () {
        const actor = $gameParty.leader();
        if (!actor) return;
        const skillId = actor.mapSkillId();
        if (!skillId) { SoundManager.playBuzzer(); return; }        // 沒有裝備任何技能
        if (MapSkill.isOnCooldown(skillId)) { SoundManager.playBuzzer(); return; } // 冷卻中
        const skill = $dataSkills[skillId];
        if (!actor.isLearnedSkill(skillId)) { SoundManager.playBuzzer(); return; } // 尚未學會
        // MP/TP：依參數決定是否檢查與扣除
        if (!P.ignoreCost) {
            if (!actor.canUse(skill)) { SoundManager.playBuzzer(); return; } // MP/TP 不足或使用時機不符
            actor.paySkillCost(skill);
        }
        MapSkill.startCooldown(skillId);      // 先進冷卻（空放照樣冷卻）
        SoundManager.playUseSkill();
        MapSkill.executeMapSkill(skillId, actor.actorId()); // 直接施放：播動畫→找目標，沒目標也無妨
    };

    // 按切換鍵：在隊長已學的地圖技能之間循環
    Scene_Map.prototype.cycleLeaderMapSkill = function () {
        const actor = $gameParty.leader();
        if (!actor) return;
        const list = MapSkill.learnedMapSkills(actor);
        if (list.length === 0) { SoundManager.playBuzzer(); return; }
        let idx = list.indexOf(actor.mapSkillId());
        idx = (idx + 1) % list.length;
        actor.setMapSkillId(list[idx]);
        SoundManager.playCursor(); // HUD 會自動反映新技能
    };

    Scene_Map.prototype.updatePendingMapSkill = function () {
        const req = $gameTemp.pendingMapSkill();
        if (!req) return;
        if (!this.isActive() || $gameMessage.isBusy()) return;
        if ($gamePlayer.isTransferring() || $gameMap.isEventRunning()) return;
        $gameTemp.clearPendingMapSkill();
        MapSkill.executeMapSkill(req.skillId, req.actorId);
    };

    // ========================================================================
    // 遇敵抑制（隱匿中歸零，雙保險）
    // ========================================================================
    const _encounterProgressValue = Game_Player.prototype.encounterProgressValue;
    Game_Player.prototype.encounterProgressValue = function () {
        if (MapSkill.isStealthActive() && P.zeroEncounter) return 0;
        return _encounterProgressValue.call(this);
    };
    const _canEncounter = Game_Player.prototype.canEncounter;
    Game_Player.prototype.canEncounter = function () {
        if (MapSkill.isStealthActive() && P.zeroEncounter) return false;
        return _canEncounter ? _canEncounter.call(this) : true;
    };

    // ========================================================================
    // 追擊抑制（隱匿中「接近玩家」型事件改隨機遊走）
    // ========================================================================
    const _moveTypeTowardPlayer = Game_Character.prototype.moveTypeTowardPlayer;
    Game_Event.prototype.moveTypeTowardPlayer = function () {
        if (MapSkill.isStealthActive() && P.stopChase) { this.moveRandom(); return; }
        _moveTypeTowardPlayer.call(this);
    };

    // ========================================================================
    // 每一步：狀態步數倒數
    // ========================================================================
    const _increaseSteps = Game_Player.prototype.increaseSteps;
    Game_Player.prototype.increaseSteps = function () {
        _increaseSteps.call(this);
        MapSkill.onPlayerStep();
    };

    // ========================================================================
    // Sprite_MapDamage：地圖上飄傷害數字
    // ========================================================================
    function Sprite_MapDamage() { this.initialize.apply(this, arguments); }
    Sprite_MapDamage.prototype = Object.create(Sprite.prototype);
    Sprite_MapDamage.prototype.constructor = Sprite_MapDamage;
    Sprite_MapDamage.prototype.initialize = function (value, character) {
        Sprite.prototype.initialize.call(this);
        this._character = character;
        this._life = 44;
        this._offsetY = 0;
        this.anchor.x = 0.5; this.anchor.y = 1; this.z = 9;
        this.bitmap = new Bitmap(120, 40);
        this.bitmap.fontSize = 26;
        this.bitmap.textColor = "#ffffff";
        this.bitmap.outlineColor = "rgba(0,0,0,0.85)";
        this.bitmap.outlineWidth = 5;
        this.bitmap.drawText(String(value), 0, 0, 120, 40, "center");
        this.updatePosition();
    };
    Sprite_MapDamage.prototype.update = function () {
        Sprite.prototype.update.call(this);
        this._life--; this._offsetY += 1.4;
        if (this._life < 14) this.opacity -= 20;
        this.updatePosition();
        if (this._life <= 0 && this.parent) this.parent.removeChild(this);
    };
    Sprite_MapDamage.prototype.updatePosition = function () {
        if (!this._character) return;
        this.x = this._character.screenX();
        this.y = this._character.screenY() - 28 - this._offsetY;
    };

    // ========================================================================
    // Sprite_MapSkillHud：左下角 HUD（裝備技能常駐 + 其他冷卻 + 生效狀態）
    // ========================================================================
    function Sprite_MapSkillHud() { this.initialize.apply(this, arguments); }
    Sprite_MapSkillHud.prototype = Object.create(Sprite.prototype);
    Sprite_MapSkillHud.prototype.constructor = Sprite_MapSkillHud;

    const HUD_ROW_H = 38;
    const HUD_WIDTH = 200;
    const HUD_MAX_ROW = 8;

    Sprite_MapSkillHud.prototype.initialize = function () {
        Sprite.prototype.initialize.call(this);
        const h = HUD_ROW_H * HUD_MAX_ROW;
        this.bitmap = new Bitmap(HUD_WIDTH, h);
        this.x = 8 + P.hudX;
        this.y = Graphics.height - h - 8 + P.hudY;
        this._sig = null;
        this._iconBitmap = ImageManager.loadSystem("IconSet");
        this._iconBitmap.addLoadListener(() => { this._sig = null; });
    };

    Sprite_MapSkillHud.prototype.update = function () {
        Sprite.prototype.update.call(this);
        const entries = this.gatherEntries();
        let visible = P.hudEnabled && entries.length > 0;
        if (P.hideHudInMessage && $gameMessage.isBusy()) visible = false;
        this.visible = visible;
        if (!this.visible) return;
        const sig = entries.map((e) => (e.active ? "*" : "") + e.icon + ":" + e.text).join("|");
        if (sig !== this._sig) { this._sig = sig; this.redraw(entries); }
    };

    Sprite_MapSkillHud.prototype.gatherEntries = function () {
        const list = [];
        const leader = $gameParty.leader();
        const equippedId = leader ? leader.mapSkillId() : 0;
        const cds = MapSkill.cooldowns();

        // 1. 常駐顯示「裝備中的技能」：就緒顯示技能名，冷卻中顯示倒數
        if (equippedId && $dataSkills[equippedId]) {
            const sk = $dataSkills[equippedId];
            const onCd = (cds[equippedId] || 0) > 0;
            list.push({
                icon: sk.iconIndex,
                text: onCd ? MapSkill.cooldownSeconds(equippedId) + "s" : sk.name,
                active: true,
            });
        }
        // 2. 其他正在冷卻中的技能（例如透過菜單指令施放的）
        for (const cfg of MapSkill.allConfigs()) {
            if (cfg.skillId === equippedId) continue;
            if ((cds[cfg.skillId] || 0) > 0) {
                const sk = $dataSkills[cfg.skillId];
                if (sk) list.push({ icon: sk.iconIndex, text: MapSkill.cooldownSeconds(cfg.skillId) + "s" });
            }
        }
        // 3. 生效中的狀態（依 stateId 去重）
        const shown = new Set();
        for (const cfg of MapSkill.allConfigs()) {
            if (cfg.skillType !== "state" || cfg.stateId <= 0 || shown.has(cfg.stateId)) continue;
            if (MapSkill.stateActiveOnParty(cfg.stateId)) {
                const st = $dataStates[cfg.stateId];
                if (st) { shown.add(cfg.stateId); list.push({ icon: st.iconIndex, text: MapSkill.stateRemainingText(cfg.stateId) }); }
            }
        }
        return list;
    };

    Sprite_MapSkillHud.prototype.redraw = function (entries) {
        const bmp = this.bitmap;
        bmp.clear();
        const n = Math.min(entries.length, HUD_MAX_ROW);
        const totalH = n * HUD_ROW_H;
        const top = bmp.height - totalH; // 由底部往上排列
        bmp.fillRect(0, top, HUD_WIDTH, totalH, "rgba(0,0,0,0.5)");

        const iw = ImageManager.iconWidth;
        const ih = ImageManager.iconHeight;
        bmp.outlineColor = "rgba(0,0,0,0.8)";
        bmp.outlineWidth = 4;

        for (let i = 0; i < n; i++) {
            const e = entries[i];
            const y = top + i * HUD_ROW_H;
            if (this._iconBitmap.isReady()) {
                const sx = (e.icon % 16) * iw;
                const sy = Math.floor(e.icon / 16) * ih;
                bmp.blt(this._iconBitmap, sx, sy, iw, ih, 8, y + (HUD_ROW_H - ih) / 2);
            }
            bmp.fontSize = 22;
            // 裝備中技能用亮綠色並加箭頭，突顯「按 J 會放這招」
            bmp.textColor = e.active ? "#8cff8c" : "#ffffff";
            const prefix = e.active ? "\u25B6" : "";
            bmp.drawText(prefix + e.text, 8 + iw + 6, y, HUD_WIDTH - iw - 20, HUD_ROW_H, "left");
        }
    };
})();
