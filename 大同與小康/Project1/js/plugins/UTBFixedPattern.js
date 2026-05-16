//=============================================================================
// UTBFixedPattern.js
// 版本：1.0.0
//=============================================================================

/*:
 * @target MZ
 * @plugindesc v1.0 魂系固定彈幕Boss ─ 每次攻擊完全相同，玩家通過反覆嘗試學習破解
 * @author SeeMi Studio
 * @base SRD_UndertaleBattleSystem_MZ
 * @orderAfter SRD_UndertaleBattleSystem_MZ
 *
 * @param targetSkillId
 * @text 目標技能 ID
 * @type skill
 * @default 1
 * @desc 要套用固定彈幕攻擊的技能 ID。技能備註欄請留空，插件自動注入。
 *
 * @param sweepSpeed
 * @text 掃射速度
 * @type number
 * @min 2
 * @max 15
 * @default 5
 * @desc 橫向掃射條的水平移動速度（像素/幀）。越大越難閃避。
 *
 * @param dropSpeed
 * @text 落彈速度
 * @type number
 * @min 1
 * @max 10
 * @default 4
 * @desc 從上方落下的彈幕垂直速度（像素/幀）。
 *
 * @param spikeSpeed
 * @text 釘刺速度
 * @type number
 * @min 1
 * @max 10
 * @default 4
 * @desc 從地板升起的釘刺垂直速度（像素/幀）。
 *
 * @help
 * ══════════════════════════════════════════════════════
 *  魂系固定彈幕Boss插件 v1.0
 *  需搭配 SRD_UndertaleBattleSystem_MZ.js 使用
 * ══════════════════════════════════════════════════════
 *
 * 【設計理念】
 * 本插件模仿魂系遊戲Boss設計哲學：
 * ・每次攻擊序列完全相同，無任何隨機性
 * ・每個攻擊都有固定的「安全區」，玩家可以學習記憶
 * ・四個階段循序漸進教學，最終階段綜合考驗所有知識
 * ・死亡後重試，記憶模式，逐漸熟練，最終過關
 *
 * 【四個攻擊階段】
 * ┌─ 第一階段「三斬」 ─────────────────────────────────┐
 * │ 學習橫向掃射的三個高度（高/中/低）                  │
 * │ 金色左牆光條＝警告從左側來                           │
 * └────────────────────────────────────────────────────┘
 * ┌─ 第二階段「四柱」 ─────────────────────────────────┐
 * │ 學習從上方落下的固定欄位位置                         │
 * │ 模式α：欄位在10/30/70/90%→安全在中央50%            │
 * │ 模式β：欄位在30/50/70%→安全在左右兩側邊緣           │
 * │ 金色頂部光條＝警告從上方落下                         │
 * └────────────────────────────────────────────────────┘
 * ┌─ 第三階段「重力牢籠」 ──────────────────────────────┐
 * │ 學習地板釘刺的固定位置（重力模式）                   │
 * │ 逐步縮緊：兩側→加內側→更密→中央藍色突刺（陷阱！）   │
 * └────────────────────────────────────────────────────┘
 * ┌─ 第四階段「終焉審判」 ──────────────────────────────┐
 * │ 同時組合前三階段所有技能                             │
 * │ 最終爆發：紅色超速落彈＋中層掃射同時發動             │
 * │ 安全位置：X=中央50%、Y=上方或下方（非中層）          │
 * └────────────────────────────────────────────────────┘
 *
 * 【安全區備忘錄（提供給玩家參考）】
 *
 *   金色左牆警告 → 掃射從左來 → 看高度決定上/中/下
 *     ・只有頂部光條閃  → 閃到中間或底部
 *     ・只有底部光條閃  → 閃到中間或頂部
 *     ・頂+底同時閃    → 只能在「正中央」
 *     ・中央光條閃     → 不能在中央！去頂部或底部
 *
 *   金色頂部警告 → 落彈從上來 → 看學會的欄位位置
 *     ・模式α（密）  → 站在「正中央（50%）」
 *     ・模式β（疏）  → 站在「最左或最右邊緣」
 *
 *   重力模式 → 釘刺從地板升起 → 看位置移到空隙
 *     ・第一波  → 只有兩側，中央全部安全
 *     ・第二波  → 左+左中，站右半部
 *     ・第三波  → 四根，只剩 35%～65% 中央安全
 *     ・藍色警告 → 中央有陷阱！要立即離開！
 *
 * 【使用步驟】
 * 1. 在插件管理員設定「目標技能 ID」
 * 2. 目標技能的備註欄留空（插件自動注入）
 * 3. 在插件管理員調整速度參數（數值越大越難）
 * 4. 讓敵人使用該技能即可觸發固定彈幕
 *
 * 【Script 指令】
 * UTBFixed.reload();     → 修改參數後強制重新注入
 * UTBFixed.getNotetag(); → 主控台印出完整備註欄代碼（可手動備用）
 * UTBFixed.printGuide(); → 主控台印出攻擊時序表（偵錯用）
 *
 * ══════════════════════════════════════════════════════
 */

(() => {
  'use strict';

  const PLUGIN_NAME = 'UTBFixedPattern';
  const params = PluginManager.parameters(PLUGIN_NAME);

  //===========================================================================
  // ■ 讀取插件參數
  //===========================================================================

  const Cfg = {
    targetSkillId: Number(params['targetSkillId'] || 1),
    sweepSpeed:    Number(params['sweepSpeed']    || 5),
    dropSpeed:     Number(params['dropSpeed']     || 4),
    spikeSpeed:    Number(params['spikeSpeed']    || 4),
  };

  //===========================================================================
  // ■ 攻擊時序表（固定、不隨機）
  //
  // 攻擊物件對應表：
  //  橫向掃射（L→R）：
  //    1 = 頂部 12% 高度（白色長條）
  //    2 = 中央 50% 高度（白色長條）
  //    3 = 底部 88% 高度（白色長條）
  //  落彈（從上方落下）：
  //    6 = X位置 10%    7 = X位置 30%    8 = X位置 50%
  //    9 = X位置 70%   10 = X位置 90%
  //  釘刺（從地板升起）：
  //   11 = X位置 10%   12 = X位置 35%
  //   13 = X位置 65%   14 = X位置 90%
  //   15 = X位置 50%（藍色高速，陷阱）
  //  終結落彈（紅色高速）：
  //   16 = X位置 10%   17 = X位置 30%
  //   18 = X位置 70%   19 = X位置 90%
  //  警告指示器（無碰撞）：
  //   20 = 左牆金色光條（橫向掃射預警）
  //   21 = 右牆金色光條（右向掃射預警，第四階段）
  //   22 = 頂部金色光條（落彈/釘刺預警）
  //
  // 安全區計算：
  //  第一階段掃射 → 看高度避開
  //  第二階段模式α（攻擊6,7,9,10）→ 安全在中央（X=50%）
  //  第二階段模式β（攻擊7,8,9）  → 安全在兩側邊緣（X≤15% 或 X≥85%）
  //  第三階段釘刺逐步縮緊：
  //    只有11,14       → 整個中央都安全
  //    11,12,14        → 13%~88% 的右半部安全（排除10%和35%）
  //    11,12,13,14     → 35%~65% 之間的中心帶安全
  //    加上15（中央藍） → 第三階段後期沒有完全安全位置，必須跳躍
  //  第四階段終焉爆發：
  //    攻擊2+16,17,18,19 → 中層掃射+紅彈10/30/70/90
  //                       → 安全：X=50%（跳過紅彈）且Y=頂部或底部（跳過中層掃射）
  //
  //===========================================================================

  /**
   * 產生固定時序的 UTB Code 字串。
   * 此函式的輸出在相同參數下永遠相同，保證每次攻擊一致。
   * @returns {string} UTB Code 內容
   */
  function generateUTBCode() {

    // ─────────────────────────────────────────────
    // 第一階段「三斬」 ─ 掃射高度學習 (f=0~270)
    // ─────────────────────────────────────────────
    //
    // 教學節奏：
    //   招式A → 只有頂部    → 去中間或底部
    //   招式B → 只有底部    → 去中間或頂部
    //   招式C → 頂部+底部   → 必須在正中央！（第一個真正的陷阱）
    //   招式D → 只有中央    → 不能在中央（與C相反，考驗記憶）
    //
    const phase1 = `
if (f === 30)  { this.createAttack(20); }
if (f === 50)  { this.createAttack(1); }
if (f === 100) { this.createAttack(20); }
if (f === 120) { this.createAttack(3); }
if (f === 165) { this.createAttack(20); }
if (f === 185) { this.createAttack(1); this.createAttack(3); }
if (f === 235) { this.createAttack(20); }
if (f === 255) { this.createAttack(2); }`.trim();

    // ─────────────────────────────────────────────
    // 第二階段「四柱」 ─ 落彈欄位學習 (f=270~460)
    // ─────────────────────────────────────────────
    //
    // 教學節奏：
    //   模式α（重複兩次）→ 固定欄位 10/30/70/90% → 學習「中央50%是安全的」
    //   模式β（重複兩次）→ 固定欄位 30/50/70%    → 學習「中央危險！要去兩側邊緣」
    //   模式α與β的安全區完全相反，強迫玩家精確判斷當前模式
    //
    const phase2 = `
if (f === 280) { this.createAttack(22); }
if (f === 300) { this.createAttack(6); this.createAttack(7); this.createAttack(9); this.createAttack(10); }
if (f === 340) { this.createAttack(22); }
if (f === 360) { this.createAttack(6); this.createAttack(7); this.createAttack(9); this.createAttack(10); }
if (f === 390) { this.createAttack(22); }
if (f === 410) { this.createAttack(7); this.createAttack(8); this.createAttack(9); }
if (f === 435) { this.createAttack(22); }
if (f === 455) { this.createAttack(7); this.createAttack(8); this.createAttack(9); }`.trim();

    // ─────────────────────────────────────────────
    // 第三階段「重力牢籠」 ─ 釘刺位置學習 (f=460~630)
    // ─────────────────────────────────────────────
    //
    // 教學節奏（漸進縮緊）：
    //   波1 → 只有最兩側（10%, 90%）   → 整個中央都安全，輕鬆
    //   波2 → 加入左中（10,35,90%）    → 安全區縮小到右半部
    //   波3 → 四根全開（10,35,65,90%） → 安全區只剩35%~65%的中心帶
    //   陷阱波 → 中央藍色釘刺（50%）    → 玩家以為中央安全，突然中招
    //           （藍色比白色快很多，要快速跳開）
    //
    const phase3 = `
if (f === 460) { p.setMode(1); }
if (f === 475) { this.createAttack(22); }
if (f === 495) { this.createAttack(11); this.createAttack(14); }
if (f === 525) { this.createAttack(22); }
if (f === 545) { this.createAttack(11); this.createAttack(12); this.createAttack(14); }
if (f === 575) { this.createAttack(22); }
if (f === 595) { this.createAttack(11); this.createAttack(12); this.createAttack(13); this.createAttack(14); }
if (f === 613) { this.createAttack(22); }
if (f === 620) { this.createAttack(15); }`.trim();

    // ─────────────────────────────────────────────
    // 第四階段「終焉審判」 ─ 綜合考驗 (f=630~840)
    // ─────────────────────────────────────────────
    //
    // 考驗節奏（組合前三階段知識）：
    //   招式1  → 頂部掃射（去低位）
    //   招式2  → 模式α落彈（在低位的中央X）
    //         → 玩家需同時：低位Y + 中央X
    //   招式3  → 底部掃射（去高位）
    //   招式4  → 模式β落彈（在高位的邊緣X）
    //         → 玩家需同時：高位Y + 邊緣X
    //   招式5  → 頂+底掃射（回到中央Y）
    //   招式6  → 左右雙側金色警告
    //   ──────────────────────────
    //   終焉爆發！
    //   中層掃射（Y=中央） + 紅色快速落彈（X=10,30,70,90）
    //   ↓
    //   安全區：X=中央50%、Y=頂部或底部（非中層）
    //   這需要玩家同時記住：
    //     「中央X是紅彈的安全位」
    //     「中央Y是掃射的危險位」
    //   → 在頂部或底部靠近中央X等待 = 唯一生路
    //
    const phase4 = `
if (f === 630) { p.setMode(0); }
if (f === 645) { this.createAttack(20); }
if (f === 665) { this.createAttack(1); }
if (f === 678) { this.createAttack(22); }
if (f === 698) { this.createAttack(6); this.createAttack(7); this.createAttack(9); this.createAttack(10); }
if (f === 720) { this.createAttack(20); }
if (f === 740) { this.createAttack(3); }
if (f === 752) { this.createAttack(22); }
if (f === 772) { this.createAttack(7); this.createAttack(8); this.createAttack(9); }
if (f === 782) { this.createAttack(20); this.createAttack(21); }
if (f === 797) { this.createAttack(1); this.createAttack(3); }
if (f === 816) { this.createAttack(20); this.createAttack(21); this.createAttack(22); }
if (f === 828) { this.createAttack(2); this.createAttack(16); this.createAttack(17); this.createAttack(18); this.createAttack(19); }`.trim();

    return [phase1, phase2, phase3, phase4].join('\n');
  }

  /**
   * 產生所有 22 種攻擊物件的備註欄定義。
   * 全部使用 this.window 的相對比例座標，無任何 Math.randomInt()，
   * 確保每次攻擊位置完全一致。
   * @returns {string}
   */
  function generateAttackDefinitions() {
    const ss  = Cfg.sweepSpeed;  // 掃射速度
    const ds  = Cfg.dropSpeed;   // 落彈速度
    const sp  = Cfg.spikeSpeed;  // 釘刺速度
    const rs  = sp + 4;          // 終結落彈速度（比一般快）
    const bsp = sp + 3;          // 藍色釘刺速度（比白色釘刺快）

    return `
<UTB Attack 1>
Initial X: this.window.left - 10
Initial Y: this.window.top + this.window.height * 0.12
Collision Type: rect
Width: 65
Height: 14
X Speed: ${ss}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 1>

<UTB Attack 2>
Initial X: this.window.left - 10
Initial Y: this.window.top + this.window.height * 0.50
Collision Type: rect
Width: 65
Height: 14
X Speed: ${ss}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 2>

<UTB Attack 3>
Initial X: this.window.left - 10
Initial Y: this.window.top + this.window.height * 0.88
Collision Type: rect
Width: 65
Height: 14
X Speed: ${ss}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 3>

<UTB Attack 4>
Initial X: this.window.right + 10
Initial Y: this.window.top + this.window.height * 0.12
Collision Type: rect
Width: 65
Height: 14
X Speed: -${ss}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 4>

<UTB Attack 5>
Initial X: this.window.right + 10
Initial Y: this.window.top + this.window.height * 0.88
Collision Type: rect
Width: 65
Height: 14
X Speed: -${ss}
Y Speed: 0
Color: white
Spawn Rate: 99999
</UTB Attack 5>

<UTB Attack 6>
Initial X: this.window.left + this.window.width * 0.10
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 9
X Speed: 0
Y Speed: ${ds}
Color: white
Spawn Rate: 99999
</UTB Attack 6>

<UTB Attack 7>
Initial X: this.window.left + this.window.width * 0.30
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 9
X Speed: 0
Y Speed: ${ds}
Color: white
Spawn Rate: 99999
</UTB Attack 7>

<UTB Attack 8>
Initial X: this.window.left + this.window.width * 0.50
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 9
X Speed: 0
Y Speed: ${ds}
Color: white
Spawn Rate: 99999
</UTB Attack 8>

<UTB Attack 9>
Initial X: this.window.left + this.window.width * 0.70
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 9
X Speed: 0
Y Speed: ${ds}
Color: white
Spawn Rate: 99999
</UTB Attack 9>

<UTB Attack 10>
Initial X: this.window.left + this.window.width * 0.90
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 9
X Speed: 0
Y Speed: ${ds}
Color: white
Spawn Rate: 99999
</UTB Attack 10>

<UTB Attack 11>
Initial X: this.window.left + this.window.width * 0.10
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 14
Height: 45
X Speed: 0
Y Speed: -${sp}
Color: white
Spawn Rate: 99999
</UTB Attack 11>

<UTB Attack 12>
Initial X: this.window.left + this.window.width * 0.35
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 14
Height: 45
X Speed: 0
Y Speed: -${sp}
Color: white
Spawn Rate: 99999
</UTB Attack 12>

<UTB Attack 13>
Initial X: this.window.left + this.window.width * 0.65
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 14
Height: 45
X Speed: 0
Y Speed: -${sp}
Color: white
Spawn Rate: 99999
</UTB Attack 13>

<UTB Attack 14>
Initial X: this.window.left + this.window.width * 0.90
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 14
Height: 45
X Speed: 0
Y Speed: -${sp}
Color: white
Spawn Rate: 99999
</UTB Attack 14>

<UTB Attack 15>
Initial X: this.window.left + this.window.width * 0.50
Initial Y: this.window.bottom + 10
Collision Type: rect
Width: 18
Height: 55
X Speed: 0
Y Speed: -${bsp}
Color: #66CCFF
Spawn Rate: 99999
</UTB Attack 15>

<UTB Attack 16>
Initial X: this.window.left + this.window.width * 0.10
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 11
X Speed: 0
Y Speed: ${rs}
Color: #FF4444
Spawn Rate: 99999
</UTB Attack 16>

<UTB Attack 17>
Initial X: this.window.left + this.window.width * 0.30
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 11
X Speed: 0
Y Speed: ${rs}
Color: #FF4444
Spawn Rate: 99999
</UTB Attack 17>

<UTB Attack 18>
Initial X: this.window.left + this.window.width * 0.70
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 11
X Speed: 0
Y Speed: ${rs}
Color: #FF4444
Spawn Rate: 99999
</UTB Attack 18>

<UTB Attack 19>
Initial X: this.window.left + this.window.width * 0.90
Initial Y: this.window.top - 10
Collision Type: circle
Radius: 11
X Speed: 0
Y Speed: ${rs}
Color: #FF4444
Spawn Rate: 99999
</UTB Attack 19>

<UTB Attack 20>
Initial X: this.window.left
Initial Y: this.window.top + this.window.height * 0.5
Collision Type: rect
Width: 8
Height: 300
X Speed: 0
Y Speed: 0
Color: #FFD700
Spawn Rate: 99999
<Direct Code>
this._age = (this._age || 0) + 1;
this._mywidth = 0;
this._myheight = 0;
this.opacity = this._age < 8 ? this._age * 30 : Math.max(0, 240 - (this._age - 8) * 14);
if (this._age > 24) this.xspeed = 9999;
</Direct Code>
</UTB Attack 20>

<UTB Attack 21>
Initial X: this.window.right
Initial Y: this.window.top + this.window.height * 0.5
Collision Type: rect
Width: 8
Height: 300
X Speed: 0
Y Speed: 0
Color: #FFD700
Spawn Rate: 99999
<Direct Code>
this._age = (this._age || 0) + 1;
this._mywidth = 0;
this._myheight = 0;
this.opacity = this._age < 8 ? this._age * 30 : Math.max(0, 240 - (this._age - 8) * 14);
if (this._age > 24) this.xspeed = -9999;
</Direct Code>
</UTB Attack 21>

<UTB Attack 22>
Initial X: this.window.left + this.window.width * 0.5
Initial Y: this.window.top
Collision Type: rect
Width: 300
Height: 8
X Speed: 0
Y Speed: 0
Color: #FFD700
Spawn Rate: 99999
<Direct Code>
this._age = (this._age || 0) + 1;
this._mywidth = 0;
this._myheight = 0;
this.opacity = this._age < 8 ? this._age * 30 : Math.max(0, 240 - (this._age - 8) * 14);
if (this._age > 24) this.yspeed = 9999;
</Direct Code>
</UTB Attack 22>`.trim();
  }

  /**
   * 產生完整的技能備註欄字串。
   * @returns {string}
   */
  function generateFullNotetag() {
    const utbCode = generateUTBCode();
    const attacks = generateAttackDefinitions();
    return [
      '<Use Undertale Attack>',
      '<UTB Duration: 840>',
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
  // ■ 攻擊時序備忘錄（供 UTBFixed.printGuide() 輸出）
  //===========================================================================

  const ATTACK_GUIDE = [
    '═══════════════════════════════════════════════',
    ' UTBFixedPattern 攻擊時序表 & 安全區備忘錄',
    '═══════════════════════════════════════════════',
    '',
    '【第一階段：三斬（f=0~270）】',
    '  f=50  頂部掃射    → 安全：中間 或 底部',
    '  f=120 底部掃射    → 安全：中間 或 頂部',
    '  f=185 頂+底同時   → 安全：只有正中央！',
    '  f=255 中央掃射    → 安全：頂部 或 底部（不能在中央）',
    '',
    '【第二階段：四柱（f=270~460）】',
    '  f=300 模式α（10,30,70,90%落彈）→ 安全：X=中央50%',
    '  f=360 模式α（重複）             → 安全：X=中央50%',
    '  f=410 模式β（30,50,70%落彈）   → 安全：X=最左或最右邊緣',
    '  f=455 模式β（重複）             → 安全：X=最左或最右邊緣',
    '',
    '【第三階段：重力牢籠（f=460~630）重力模式！】',
    '  f=495 兩側釘刺（10%,90%）      → 安全：整個中央',
    '  f=545 加密（10%,35%,90%）      → 安全：37%~88%',
    '  f=595 四根（10%,35%,65%,90%） → 安全：只剩36%~64%',
    '  f=620 藍色中央陷阱（50%，超快） → 立刻離開中央！',
    '',
    '【第四階段：終焉審判（f=630~840）】',
    '  f=665 頂部掃射+模式α落彈  → 低位Y + 中央X',
    '  f=740 底部掃射+模式β落彈  → 高位Y + 邊緣X',
    '  f=797 頂+底同時            → 中央Y',
    '  ─────────────────────────',
    '  f=828 終焉爆發！           → 唯一安全區：',
    '        中層掃射             → Y=頂部 或 Y=底部',
    '        紅彈（10,30,70,90%） → X=中央50%',
    '        ⇒ 站在「頂部或底部」的「中央X=50%」！',
    '',
    '═══════════════════════════════════════════════',
  ].join('\n');

  //===========================================================================
  // ■ 技能注入函式
  //===========================================================================

  function injectIntoSkill() {
    const skill = $dataSkills[Cfg.targetSkillId];
    if (!skill) {
      console.warn(`[UTBFixedPattern] 找不到技能 ID = ${Cfg.targetSkillId}。請確認插件參數設定。`);
      return;
    }

    // 防止重複注入（支援 reload()）
    if (skill._utbFixedOriginalNote !== undefined) {
      skill.note = skill._utbFixedOriginalNote;
    }
    skill._utbFixedOriginalNote = skill.note;

    skill.note += '\n' + generateFullNotetag();

    console.log(
      `%c[UTBFixedPattern] 已注入技能「${skill.name}」（ID: ${Cfg.targetSkillId}）。` +
      `固定攻擊時序，共 840 幀（14 秒），4 個階段，22 種攻擊物件。`,
      'color: #FFD700; font-weight: bold;'
    );
  }

  //===========================================================================
  // ■ 全域公開物件 UTBFixed
  //===========================================================================

  window.UTBFixed = {

    /**
     * 重新注入攻擊代碼。修改插件參數後呼叫此方法立即生效。
     * 在腳本事件中：UTBFixed.reload();
     */
    reload() {
      injectIntoSkill();
    },

    /**
     * 在主控台（F8）印出完整備註欄代碼。
     * 可複製後手動貼入技能備註欄。
     */
    getNotetag() {
      const notetag = generateFullNotetag();
      console.log('=== UTBFixedPattern 備註欄代碼 ===\n' + notetag + '\n=== 結束 ===');
    },

    /**
     * 在主控台（F8）印出攻擊時序表與安全區備忘錄。
     * 供開發者偵錯、或製作攻略說明。
     */
    printGuide() {
      console.log(ATTACK_GUIDE);
    },
  };

  //===========================================================================
  // ■ DataManager 擴展 ─ 資料庫載入完成後自動注入
  //===========================================================================

  const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
  DataManager.isDatabaseLoaded = function () {
    if (!_DataManager_isDatabaseLoaded.call(this)) return false;
    if (!this._utbFixedInjected) {
      this._utbFixedInjected = true;
      injectIntoSkill();
    }
    return true;
  };

  //===========================================================================
  // ■ 載入完成通知
  //===========================================================================

  console.log(
    `%c[UTBFixedPattern] v1.0 已載入。目標技能 ID: ${Cfg.targetSkillId}。` +
    `固定彈幕模式，總時長 840 幀 (14.0 秒)。`,
    'color: #FFD700; font-weight: bold;'
  );

})();
