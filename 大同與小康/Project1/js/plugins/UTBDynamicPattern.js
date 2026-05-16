//=============================================================================
// UTBDynamicPattern.js
// 版本：1.0.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc v1.0 UTB 動態攻擊時序 ─ 透過插件管理員調整攻擊頻率，自動注入技能備註欄
 * @author SeeMi Studio
 * @base SRD_UndertaleBattleSystem_MZ
 * @orderAfter SRD_UndertaleBattleSystem_MZ
 *
 * @param targetSkillId
 * @text 目標技能 ID
 * @type skill
 * @default 1
 * @desc 要套用動態攻擊時序的技能 ID。該技能的備註欄無需任何 UTB 設定，插件會自動注入。
 *
 * @param warningGap
 * @text 警告提前幀數
 * @type number
 * @min 5
 * @max 40
 * @default 20
 * @desc 攻擊警告光條出現在真實攻擊前幾幀（60fps，20 幀 ≈ 0.33 秒）。
 *
 * @param p1Duration
 * @text 【第一階段】持續時間
 * @type number
 * @min 60
 * @max 360
 * @default 180
 * @desc 第一階段（左側掃射）的持續幀數。
 *
 * @param p1SweepInterval
 * @text 【第一階段】掃射間隔
 * @type number
 * @min 20
 * @max 120
 * @default 55
 * @desc 每次掃射之間的間隔幀數（數字越小越頻繁）。
 *
 * @param p1Speed
 * @text 【第一階段】掃射速度
 * @type number
 * @min 2
 * @max 12
 * @default 6
 * @desc 掃射物體的水平移動速度（像素/幀）。
 *
 * @param p2Duration
 * @text 【第二階段】持續時間
 * @type number
 * @min 60
 * @max 360
 * @default 150
 * @desc 第二階段（雙向掃射＋上方落彈）的持續幀數。
 *
 * @param p2SweepInterval
 * @text 【第二階段】掃射間隔
 * @type number
 * @min 20
 * @max 120
 * @default 65
 * @desc 第二階段掃射（左右雙向）之間的間隔幀數。
 *
 * @param p2DropInterval
 * @text 【第二階段】落彈間隔
 * @type number
 * @min 20
 * @max 150
 * @default 80
 * @desc 上方落彈每波之間的間隔幀數。
 *
 * @param p2InitDrops
 * @text 【第二階段】初始落彈數
 * @type number
 * @min 1
 * @max 8
 * @default 3
 * @desc 第一波落彈的數量（之後每波自動遞增 1，最多 8 顆）。
 *
 * @param p3Duration
 * @text 【第三階段】持續時間
 * @type number
 * @min 60
 * @max 360
 * @default 150
 * @desc 第三階段（重力模式＋釘刺）的持續幀數。
 *
 * @param p3SpikeInterval
 * @text 【第三階段】釘刺間隔
 * @type number
 * @min 15
 * @max 100
 * @default 40
 * @desc 地板釘刺每波之間的間隔幀數。
 *
 * @param p3SpikesPerWave
 * @text 【第三階段】每波釘刺數
 * @type number
 * @min 1
 * @max 8
 * @default 3
 * @desc 每次爆出的白色釘刺數量。
 *
 * @param p3BluePerWave
 * @text 【第三階段】每波藍色釘刺數
 * @type number
 * @min 0
 * @max 5
 * @default 2
 * @desc 每次爆出的藍色高速釘刺數量（第二波起才出現）。
 *
 * @param p4Duration
 * @text 【終焉階段】持續時間
 * @type number
 * @min 60
 * @max 240
 * @default 120
 * @desc 終焉階段（所有攻擊全開）的持續幀數。
 *
 * @param p4BurstInterval
 * @text 【終焉階段】爆發間隔
 * @type number
 * @min 10
 * @max 60
 * @default 24
 * @desc 終焉階段每次全攻擊爆發之間的間隔幀數。
 *
 * @param p4DropsPerBurst
 * @text 【終焉階段】每波落彈數
 * @type number
 * @min 1
 * @max 10
 * @default 4
 * @desc 終焉階段每次爆發的落彈數量。
 *
 * @param p4SpikesPerBurst
 * @text 【終焉階段】每波釘刺數
 * @type number
 * @min 1
 * @max 10
 * @default 3
 * @desc 終焉階段每次爆發的白色釘刺數量。
 *
 * @param p4BluePerBurst
 * @text 【終焉階段】每波藍釘刺數
 * @type number
 * @min 0
 * @max 5
 * @default 1
 * @desc 終焉階段每次爆發的藍色釘刺數量。
 *
 * @param finalBurstCount
 * @text 終結彈數量
 * @type number
 * @min 4
 * @max 20
 * @default 12
 * @desc 技能最後幾幀同時爆出的紅色終結彈數量（幾乎無法閃避）。
 *
 * @help
 * ══════════════════════════════════════════════════
 *  UTB 動態攻擊時序插件 v1.0
 *  需搭配 SRD_UndertaleBattleSystem_MZ.js 使用
 * ══════════════════════════════════════════════════
 *
 * 【功能說明】
 * 本插件讓你透過「插件管理員」的滑桿/數值設定，
 * 自動產生並注入四階段彈幕攻擊模式到指定技能中，
 * 不需要手動編輯技能備註欄。
 *
 * 【使用步驟】
 * 1. 在「插件管理員」設定各項參數（持續時間、間隔等）
 * 2. 設定「目標技能 ID」（該技能會被自動套用攻擊模式）
 * 3. 確保目標技能的備註欄完全清空（或只保留其他非 UTB 的備註）
 * 4. 讓敵人在戰鬥中使用該技能，即可觸發四階段彈幕
 *
 * 【四個攻擊階段】
 * ・第一階段：左側掃射（速度漸增）
 * ・第二階段：左右雙向掃射 + 上方落彈（數量遞增）
 * ・第三階段：重力模式 + 地板釘刺（白色＋藍色高速）
 * ・終焉階段：所有攻擊全開最高密度 + 終結彈
 *
 * 【Script 指令】
 * UTBPattern.reload();
 * → 重新產生攻擊代碼並注入技能（更改參數後呼叫）
 *
 * UTBPattern.getNotetag();
 * → 在主控台印出完整的備註欄代碼（可手動貼到技能備註欄作為備用）
 *
 * ══════════════════════════════════════════════════
 */

(() => {
  'use strict';

  const PLUGIN_NAME = 'UTBDynamicPattern';
  const params = PluginManager.parameters(PLUGIN_NAME);

  //===========================================================================
  // ■ 讀取插件參數
  //===========================================================================
  const Cfg = {
    targetSkillId:    Number(params['targetSkillId']    || 1),
    warningGap:       Number(params['warningGap']       || 20),
    p1Duration:       Number(params['p1Duration']       || 180),
    p1SweepInterval:  Number(params['p1SweepInterval']  || 55),
    p1Speed:          Number(params['p1Speed']          || 6),
    p2Duration:       Number(params['p2Duration']       || 150),
    p2SweepInterval:  Number(params['p2SweepInterval']  || 65),
    p2DropInterval:   Number(params['p2DropInterval']   || 80),
    p2InitDrops:      Number(params['p2InitDrops']      || 3),
    p3Duration:       Number(params['p3Duration']       || 150),
    p3SpikeInterval:  Number(params['p3SpikeInterval']  || 40),
    p3SpikesPerWave:  Number(params['p3SpikesPerWave']  || 3),
    p3BluePerWave:    Number(params['p3BluePerWave']    || 2),
    p4Duration:       Number(params['p4Duration']       || 120),
    p4BurstInterval:  Number(params['p4BurstInterval']  || 24),
    p4DropsPerBurst:  Number(params['p4DropsPerBurst']  || 4),
    p4SpikesPerBurst: Number(params['p4SpikesPerBurst'] || 3),
    p4BluePerBurst:   Number(params['p4BluePerBurst']   || 1),
    finalBurstCount:  Number(params['finalBurstCount']  || 12),
  };

  //===========================================================================
  // ■ 核心代碼產生器
  //===========================================================================

  /**
   * 根據 Cfg 設定產生所有時序事件，回傳 UTB Code 字串與統計資料。
   * 使用唯一變數名（v0, v1, v2...）避免 RPG Maker 腳本環境中的命名衝突。
   * @returns {{ utbCode: string, totalFrames: number, eventCount: number }}
   */
  function generateUTBCode() {
    const {
      warningGap,
      p1Duration, p1SweepInterval,
      p2Duration, p2SweepInterval, p2DropInterval, p2InitDrops,
      p3Duration, p3SpikeInterval, p3SpikesPerWave, p3BluePerWave,
      p4Duration, p4BurstInterval, p4DropsPerBurst, p4SpikesPerBurst, p4BluePerBurst,
      finalBurstCount,
    } = Cfg;

    // 計算各階段起始幀與總幀數
    const p2Start  = p1Duration;
    const p3Start  = p2Start + p2Duration;
    const p4Start  = p3Start + p3Duration;
    const total    = p4Start + p4Duration;
    const finalFrame = total - 30; // 終結彈在最後 30 幀前觸發

    // 事件收集器：Map<幀數, 代碼字串[]>
    const events = new Map();
    let varIndex = 0;
    const nextVar = () => `v${varIndex++}`;

    const addEvent = (rawFrame, ...codes) => {
      const frame = Math.round(rawFrame);
      if (frame < 0 || frame >= total) return;
      if (!events.has(frame)) events.set(frame, []);
      events.get(frame).push(...codes);
    };

    // ── 第一階段：左側掃射（速度漸增） ──
    const wg1 = Math.min(warningGap, p1SweepInterval - 5);
    for (let f = p1SweepInterval; f < p2Start; f += p1SweepInterval) {
      addEvent(f - wg1, 'this.createAttack(7);');
      addEvent(f, 'this.createAttack(1);');
    }

    // ── 第二階段：雙向掃射 + 落彈 ──
    const wg2 = Math.min(warningGap, Math.min(p2SweepInterval, p2DropInterval) - 5);
    for (let f = p2Start + p2SweepInterval; f < p3Start; f += p2SweepInterval) {
      addEvent(f - wg2, 'this.createAttack(7); this.createAttack(8);');
      addEvent(f, 'this.createAttack(1); this.createAttack(2);');
    }
    let dropCount = p2InitDrops;
    for (let f = p2Start + p2DropInterval; f < p3Start; f += p2DropInterval) {
      addEvent(f - wg2, 'this.createAttack(9);');
      const v = nextVar();
      addEvent(f, `for(var ${v}=0;${v}<${dropCount};${v}++) this.createAttack(3);`);
      dropCount = Math.min(dropCount + 1, 8);
    }

    // ── 第三階段：重力模式 + 釘刺 ──
    addEvent(p3Start, 'p.setMode(1);');
    const wg3 = Math.min(warningGap, p3SpikeInterval - 5);
    let spikeIndex = 0;
    for (let f = p3Start + p3SpikeInterval; f < p4Start; f += p3SpikeInterval) {
      addEvent(f - wg3, 'this.createAttack(9);');
      const vs = nextVar();
      addEvent(f, `for(var ${vs}=0;${vs}<${p3SpikesPerWave};${vs}++) this.createAttack(4);`);
      if (spikeIndex >= 1 && p3BluePerWave > 0) {
        const vb = nextVar();
        addEvent(f, `for(var ${vb}=0;${vb}<${p3BluePerWave};${vb}++) this.createAttack(5);`);
      }
      // 第三階段偶數波混入少量落彈，增加複雜度
      if (spikeIndex % 2 === 1) {
        const vd = nextVar();
        const dropFrame = Math.min(f + 10, p4Start - 1);
        addEvent(dropFrame, `for(var ${vd}=0;${vd}<2;${vd}++) this.createAttack(3);`);
      }
      spikeIndex++;
    }

    // ── 終焉階段：所有攻擊全開 ──
    addEvent(p4Start, 'p.setMode(0);');
    const wg4 = Math.min(warningGap, p4BurstInterval - 3);
    for (let f = p4Start + p4BurstInterval; f < finalFrame - wg4 - 5; f += p4BurstInterval) {
      addEvent(f - wg4, 'this.createAttack(7); this.createAttack(8); this.createAttack(9);');
      const vp = nextVar(), vq = nextVar();
      addEvent(f,
        'this.createAttack(1);',
        'this.createAttack(2);',
        `for(var ${vp}=0;${vp}<${p4DropsPerBurst};${vp}++) this.createAttack(3);`,
        `for(var ${vq}=0;${vq}<${p4SpikesPerBurst};${vq}++) this.createAttack(4);`
      );
      if (p4BluePerBurst > 0) {
        const vr = nextVar();
        addEvent(f, `for(var ${vr}=0;${vr}<${p4BluePerBurst};${vr}++) this.createAttack(5);`);
      }
    }

    // ── 終結彈：最後爆發 ──
    addEvent(finalFrame - wg4, 'this.createAttack(7); this.createAttack(8); this.createAttack(9);');
    const vf = nextVar();
    addEvent(finalFrame, `for(var ${vf}=0;${vf}<${finalBurstCount};${vf}++) this.createAttack(6);`);

    // 依幀數排序，產生代碼字串
    const sortedFrames = [...events.keys()].sort((a, b) => a - b);
    const utbCode = sortedFrames
      .map(f => `if (f === ${f}) { ${events.get(f).join(' ')} }`)
      .join('\n');

    return { utbCode, totalFrames: total, eventCount: sortedFrames.length };
  }

  /**
   * 產生九個攻擊物體的備註欄定義字串。
   * 攻擊物體說明：
   *   1: 左→右 白色掃射條
   *   2: 右→左 白色掃射條
   *   3: 上方 白色落彈
   *   4: 下方 白色釘刺
   *   5: 下方 藍色高速釘刺
   *   6: 上方 紅色終結彈（最終爆發）
   *   7: 左牆 金色警告光條
   *   8: 右牆 金色警告光條
   *   9: 中央 金色警告光暈
   * @returns {string}
   */
  function generateAttackDefinitions() {
    const speed = Cfg.p1Speed;

    return `
<UTB Attack 1>
Initial X: this.window.left - 10
Initial Y: this.window.top + Math.randomInt(this.window.height)
Collision Type: rect
Width: 60
Height: 13
X Speed: ${speed}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 1>

<UTB Attack 2>
Initial X: this.window.right + 10
Initial Y: this.window.top + Math.randomInt(this.window.height)
Collision Type: rect
Width: 60
Height: 13
X Speed: -${speed}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 2>

<UTB Attack 3>
Initial X: this.window.left + Math.randomInt(this.window.width)
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 9
X Speed: 0
Y Speed: 4
Color: white
Spawn Rate: 99999
</UTB Attack 3>

<UTB Attack 4>
Initial X: this.window.left + Math.randomInt(this.window.width)
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 16
Height: 50
X Speed: 0
Y Speed: -4
Color: white
Spawn Rate: 99999
</UTB Attack 4>

<UTB Attack 5>
Initial X: this.window.left + Math.randomInt(this.window.width)
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 22
Height: 60
X Speed: 0
Y Speed: -7
Color: #66CCFF
Spawn Rate: 99999
</UTB Attack 5>

<UTB Attack 6>
Initial X: this.window.left + Math.randomInt(this.window.width)
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 11
X Speed: 0
Y Speed: 8
Color: #FF4444
Spawn Rate: 99999
</UTB Attack 6>

<UTB Attack 7>
Initial X: this.window.left
Initial Y: this.window.y + (this.window.height / 2)
Collision Type: rect
Width: 8
Height: 200
X Speed: 0
Y Speed: 0
Color: #FFD700
Spawn Rate: 99999
<Direct Code>
this._age = (this._age || 0) + 1;
this._mywidth = 0; this._myheight = 0;
this.opacity = this._age < 8 ? this._age * 30 : Math.max(0, 240 - (this._age - 8) * 12);
if (this._age > 30) this.xspeed = 9999;
</Direct Code>
</UTB Attack 7>

<UTB Attack 8>
Initial X: this.window.right
Initial Y: this.window.y + (this.window.height / 2)
Collision Type: rect
Width: 8
Height: 200
X Speed: 0
Y Speed: 0
Color: #FFD700
Spawn Rate: 99999
<Direct Code>
this._age = (this._age || 0) + 1;
this._mywidth = 0; this._myheight = 0;
this.opacity = this._age < 8 ? this._age * 30 : Math.max(0, 240 - (this._age - 8) * 12);
if (this._age > 30) this.xspeed = -9999;
</Direct Code>
</UTB Attack 8>

<UTB Attack 9>
Initial X: this.window.x + (this.window.width / 2)
Initial Y: this.window.y + (this.window.height / 2)
Collision Type: circle
Radius: 1
X Scale: 3
Y Scale: 3
Color: #FFD700
Spawn Rate: 99999
<Direct Code>
this._age = (this._age || 0) + 1;
this.radius = 0;
this.opacity = this._age < 8 ? this._age * 30 : Math.max(0, 240 - (this._age - 8) * 12);
if (this._age > 30) this.yspeed = 9999;
</Direct Code>
</UTB Attack 9>`.trim();
  }

  /**
   * 產生完整的備註欄字串（可手動貼入技能備註欄作為備用）。
   * @returns {string}
   */
  function generateFullNotetag() {
    const { utbCode, totalFrames } = generateUTBCode();
    const attacks = generateAttackDefinitions();
    return [
      '<Use Undertale Attack>',
      `<UTB Duration: ${totalFrames}>`,
      '<UTB Mode: 0>',
      '<UTB Delete Outside Frame>',
      '',
      '<UTB Code>',
      utbCode,
      '</UTB Code>',
      '',
      attacks,
    ].join('\n');
  }

  //===========================================================================
  // ■ 技能注入核心
  //===========================================================================

  /**
   * 將動態生成的 UTB 備註欄內容注入到目標技能的 note 屬性。
   * 在 DataManager 資料庫載入完成後、UTB 插件讀取備註欄之前執行。
   */
  function injectIntoSkill() {
    const skill = $dataSkills[Cfg.targetSkillId];
    if (!skill) {
      console.warn(`[UTBDynamicPattern] 找不到技能 ID = ${Cfg.targetSkillId}，請確認插件參數設定。`);
      return;
    }

    // 若已注入過，先還原原始備註欄再重新注入（支援 reload）
    if (skill._utbOriginalNote !== undefined) {
      skill.note = skill._utbOriginalNote;
    }
    skill._utbOriginalNote = skill.note;

    const notetag = generateFullNotetag();
    skill.note += '\n' + notetag;

    const { totalFrames, eventCount } = generateUTBCode();
    console.log(
      `%c[UTBDynamicPattern] 已注入技能「${skill.name}」（ID: ${Cfg.targetSkillId}）。` +
      `總時長 ${totalFrames}幀 (${(totalFrames / 60).toFixed(1)}秒)，${eventCount} 個時序事件。`,
      'color: #66CCFF; font-weight: bold;'
    );
  }

  //===========================================================================
  // ■ 全域公開物件 UTBPattern
  //===========================================================================

  /**
   * UTBPattern：提供腳本事件可呼叫的工具方法。
   *
   * 使用方式（腳本事件中）：
   *   UTBPattern.reload();      // 重新注入（修改插件參數後使用）
   *   UTBPattern.getNotetag();  // 在主控台印出完整備註欄代碼
   */
  window.UTBPattern = {

    /**
     * 重新產生並注入攻擊代碼到目標技能。
     * 若在遊戲執行中修改過插件參數（需重啟生效），可呼叫此方法強制重新注入。
     */
    reload() {
      injectIntoSkill();
    },

    /**
     * 在瀏覽器主控台（F8）印出完整的備註欄代碼。
     * 可複製後手動貼入技能備註欄，作為不使用自動注入的替代方案。
     */
    getNotetag() {
      const notetag = generateFullNotetag();
      console.log('=== UTBDynamicPattern 備註欄代碼 ===\n' + notetag + '\n=== 結束 ===');
      console.log('[UTBDynamicPattern] 備註欄代碼已輸出至主控台。');
    },
  };

  //===========================================================================
  // ■ DataManager 擴展 ─ 資料庫載入完成後自動注入
  //===========================================================================

  /**
   * 掛載在 DataManager.isDatabaseLoaded：
   * 確保在資料庫完全載入後，且只執行一次，將動態備註欄注入目標技能。
   * UTB 插件在戰鬥場景初始化時才讀取技能備註欄，
   * 因此在 isDatabaseLoaded 時注入是安全且有效的時機。
   */
  const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
  DataManager.isDatabaseLoaded = function () {
    if (!_DataManager_isDatabaseLoaded.call(this)) return false;
    if (!this._utbPatternInjected) {
      this._utbPatternInjected = true;
      injectIntoSkill();
    }
    return true;
  };

  //===========================================================================
  // ■ 插件載入完成通知
  //===========================================================================

  console.log(
    `%c[UTBDynamicPattern] v1.0 已載入。目標技能 ID: ${Cfg.targetSkillId}。` +
    `總攻擊時長: ${(
      (Cfg.p1Duration + Cfg.p2Duration + Cfg.p3Duration + Cfg.p4Duration) / 60
    ).toFixed(1)}秒。`,
    'color: #FFD700; font-weight: bold;'
  );

})();
