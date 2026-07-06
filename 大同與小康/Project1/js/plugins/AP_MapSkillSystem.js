/*:
 * @target MZ
 * @plugindesc 地圖技能與冷卻 UI 系統 v2.3 — 修正特效前方觸發不顯示的 Bug（座標偏移法）
 * @author AI Peak, Gemini
 *
 * @help
 * ============================================================================
 * 【AP_MapSkillSystem 地圖技能與冷卻 UI 系統 v2.3】
 * ============================================================================
 *
 * 【Bug 完美修復版】
 * 採用「本體綁定 + 座標偏移」技術，保證特效絕對不會消失。
 * 特效會完美出現在玩家面對的前方一格，且支援在參數中調整大小比例！
 *
 * ----------------------------------------------------------------------------
 * ● 操作方式
 * ----------------------------------------------------------------------------
 * 攻擊鍵（預設 J）：施放「隊長目前裝備的地圖技能」。
 * 切換鍵（預設 K）：在設定好的地圖技能之間循環切換裝備。
 *
 * @command useMapSkill
 * @text 施放地圖技能
 * @arg skillId
 * @text 技能 ID
 * @type skill
 * @default 0
 * @arg actorId
 * @text 施放者角色 ID
 * @type actor
 * @default 0
 *
 * @command setMapSkill
 * @text 更換裝備技能
 * @arg skillId
 * @text 技能 ID
 * @type skill
 * @default 0
 * @arg actorId
 * @text 角色 ID
 * @type actor
 * @default 0
 *
 * @param attackKey
 * @text 攻擊鍵（施放）
 * @type string
 * @default J
 *
 * @param cycleKey
 * @text 切換鍵（換技能）
 * @type string
 * @default K
 *
 * @param ignoreCost
 * @text 空放時忽略 MP/TP 消耗
 * @type boolean
 * @on 不消耗（可自由空揮）
 * @off 照常消耗
 * @default true
 *
 * @param mapSkills
 * @text 地圖技能列表
 * @type struct<MapSkill>[]
 * @default []
 *
 * @param stealthStates
 * @text 隱匿狀態 ID 列表
 * @type state[]
 * @default []
 *
 * @param stopChase
 * @text 隱匿時停止小怪追擊
 * @type boolean
 * @default true
 *
 * @param zeroEncounter
 * @text 隱匿時遇敵率歸零
 * @type boolean
 * @default true
 *
 * @param stealthSwitchId
 * @text 隱匿狀態同步開關 ID
 * @type switch
 * @default 0
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
 * @text 对话中隐藏 HUD
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
 *
 * @param animationId
 * @text 內建動畫 ID
 * @type animation
 * @default 0
 *
 * @param animScale
 * @text 特效大小（縮放比例）
 * @desc 1.0 = 原尺寸，1.5 = 放大 1.5 倍，2.0 = 兩倍大，0.5 = 縮小一半。
 * @type number
 * @decimals 2
 * @min 0.10
 * @default 1.00
 *
 * @param cooldown
 * @text 冷卻時間（秒）
 * @type number
 * @decimals 1
 * @min 0
 * @default 3.0
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

    const PLUGIN_NAME = "AP_MapSkillSystem";

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
            animScale: Number(o.animScale || 1.00),
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
        ignoreCost: toBool(raw["ignoreCost"], true),
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

    // 全域變數：儲存當前地圖技能的動畫設定
    let _activeMapSkillAnim = null;

    // ========================================================================
    // 核心攔截：將綁定在玩家身上的地圖技能動畫，強力推移至正前方一格，並縮放大小
    // ========================================================================
    const _Sprite_Animation_updateEffectGeometry = Sprite_Animation.prototype.updateEffectGeometry;
    Sprite_Animation.prototype.updateEffectGeometry = function() {
        _Sprite_Animation_updateEffectGeometry.call(this);
        
        // 如果這個動畫是由我們的地圖技能觸發的
        if (_activeMapSkillAnim && this._animation && this._animation.id === _activeMapSkillAnim.animationId) {
            // 1. 處理大小縮放
            this.scale.x = _activeMapSkillAnim.scale;
            this.scale.y = _activeMapSkillAnim.scale;

            // 2. 處理前方一格的座標推移 (MZ 一格地圖元件通常是 48 像素，但我們跟隨系統縮放比例)
            const tileWidth = $gameMap.tileWidth();
            const tileHeight = $gameMap.tileHeight();
            const direction = $gamePlayer.direction();

            // 根據玩家方向決定要把動畫精靈往哪裡推
            switch (direction) {
                case 2: // 下
                    this.y += tileHeight;
                    break;
                case 4: // 左
                    this.x -= tileWidth;
                    break;
                case 6: // 右
                    this.x += tileWidth;
                    break;
                case 8: // 上
                    this.y -= tileHeight;
                    break;
            }
        }
    };

    // ========================================================================
    // 核心管理器
    // ========================================================================
    const MapSkill = {
        allConfigs() { return MAP_SKILLS; },
        config(skillId) { return MAP_SKILLS.find((c) => c.skillId === skillId) || null; },
        isMapSkill(skillId) { return !!this.config(skillId); },

        learnedMapSkills(actor) {
            return MAP_SKILLS.map((c) => c.skillId).filter((id) => $dataSkills[id]);
        },

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

        executeMapSkill(skillId, actorId) {
            const cfg = this.config(skillId);
            if (!cfg) return;
            const actor = $gameActors.actor(actorId) || $gameParty.leader();
            
            // 安全觸發：將動畫設定寫入全域暫存，並直接綁在主角身上要求播放
            if (cfg.animationId > 0) {
                _activeMapSkillAnim = { animationId: cfg.animationId, scale: cfg.animScale };
                $gameTemp.requestAnimation([$gamePlayer], cfg.animationId);
                // 播完後自動清除暫存
                setTimeout(() => { _activeMapSkillAnim = null; }, 200);
            }

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
    // Game_Actor
    // ========================================================================
    Game_Actor.prototype.mapSkillId = function () {
        if (this._mapSkillId && MapSkill.isMapSkill(this._mapSkillId)) return this._mapSkillId;
        const list = MapSkill.learnedMapSkills(this);
        if (list.length > 0) {
            this._mapSkillId = list[0];
            return this._mapSkillId;
        }
        return 0;
    };
    Game_Actor.prototype.setMapSkillId = function (id) {
        this._mapSkillId = id;
    };

    // ========================================================================
    // Game_Temp
    // ========================================================================
    Game_Temp.prototype.reserveMapSkill = function (skillId, actorId) {
        this._pendingMapSkill = { skillId, actorId };
    };
    Game_Temp.prototype.pendingMapSkill = function () { return this._pendingMapSkill; };
    Game_Temp.prototype.clearPendingMapSkill = function () { this._pendingMapSkill = null; };

    // ========================================================================
    // Scene_Skill
    // ========================================================================
    const _Scene_Skill_onItemOk = Scene_Skill.prototype.onItemOk;
    Scene_Skill.prototype.onItemOk = function () {
        const skill = this.item();
        if (skill && MapSkill.isMapSkill(skill.id)) {
            this.actor().setMapSkillId(skill.id);
            SoundManager.playEquip();
            this._itemWindow.refresh();
            this._itemWindow.activate();
            return;
        }
        _Scene_Skill_onItemOk.call(this);
    };

    const _Window_SkillList_drawItem = Window_SkillList.prototype.drawItem;
    Window_SkillList.prototype.drawItem = function (index) {
        _Window_SkillList_drawItem.call(this, index);
        const skill = this.itemAt(index);
        if (skill && this._actor && MapSkill.isMapSkill(skill.id) &&
            this._actor.mapSkillId() === skill.id) {
            const rect = this.itemLineRect(index);
            this.changeTextColor(ColorManager.powerUpColor());
            this.drawText("\u25B6", rect.x, rect.y, rect.width, "right");
            this.resetTextColor();
        }
    };

    // ========================================================================
    // Scene_Map
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

    Scene_Map.prototype.isMapSkillInputActive = function () {
        return this.isActive() && !$gameMessage.isBusy() && !$gameMap.isEventRunning() &&
            !$gamePlayer.isTransferring() && $gamePlayer.canMove() && !$gameTemp.pendingMapSkill();
    };

    Scene_Map.prototype.updateMapSkillInput = function () {
        if (!this.isMapSkillInputActive()) return;
        if (Input.isTriggered(KEY_ATTACK)) this.castLeaderMapSkill();
        else if (P.cycleKey && Input.isTriggered(KEY_CYCLE)) this.cycleLeaderMapSkill();
    };

    Scene_Map.prototype.castLeaderMapSkill = function () {
        const actor = $gameParty.leader();
        if (!actor) return;
        const skillId = actor.mapSkillId();
        if (!skillId) return; 
        if (MapSkill.isOnCooldown(skillId)) { SoundManager.playBuzzer(); return; }
        const skill = $dataSkills[skillId];
        if (!P.ignoreCost) {
            if (!actor.canUse(skill)) { SoundManager.playBuzzer(); return; }
            actor.paySkillCost(skill);
        }
        MapSkill.startCooldown(skillId);
        SoundManager.playUseSkill();
        MapSkill.executeMapSkill(skillId, actor.actorId());
    };

    Scene_Map.prototype.cycleLeaderMapSkill = function () {
        const actor = $gameParty.leader();
        if (!actor) return;
        const list = MapSkill.learnedMapSkills(actor);
        if (list.length === 0) { SoundManager.playBuzzer(); return; }
        let idx = list.indexOf(actor.mapSkillId());
        idx = (idx + 1) % list.length;
        actor.setMapSkillId(list[idx]);
        SoundManager.playCursor();
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
    // 遇敵與追擊抑制
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

    const _moveTypeTowardPlayer = Game_Character.prototype.moveTypeTowardPlayer;
    Game_Event.prototype.moveTypeTowardPlayer = function () {
        if (MapSkill.isStealthActive() && P.stopChase) { this.moveRandom(); return; }
        _moveTypeTowardPlayer.call(this);
    };

    const _increaseSteps = Game_Player.prototype.increaseSteps;
    Game_Player.prototype.increaseSteps = function () {
        _increaseSteps.call(this);
        MapSkill.onPlayerStep();
    };

    // ========================================================================
    // Sprite_MapDamage
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
    // Sprite_MapSkillHud
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

        if (equippedId && $dataSkills[equippedId]) {
            const sk = $dataSkills[equippedId];
            const onCd = (cds[equippedId] || 0) > 0;
            list.push({
                icon: sk.iconIndex,
                text: onCd ? MapSkill.cooldownSeconds(equippedId) + "s" : sk.name,
                active: true,
            });
        }
        for (const cfg of MapSkill.allConfigs()) {
            if (cfg.skillId === equippedId) continue;
            if ((cds[cfg.skillId] || 0) > 0) {
                const sk = $dataSkills[cfg.skillId];
                if (sk) list.push({ icon: sk.iconIndex, text: MapSkill.cooldownSeconds(cfg.skillId) + "s" });
            }
        }
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
        const top = bmp.height - totalH;
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
            bmp.textColor = e.active ? "#8cff8c" : "#ffffff";
            const prefix = e.active ? "\u25B6" : "";
            bmp.drawText(prefix + e.text, 8 + iw + 6, y, HUD_WIDTH - iw - 20, HUD_ROW_H, "left");
        }
    };
})();