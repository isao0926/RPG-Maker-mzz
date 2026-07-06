//=============================================================================
// KeyConfig.js (Gemini 相容修正修正版)
// Version  : 1.1.1
// 對應版本 : RPG Maker MZ 1.0.0+
//=============================================================================

/*:
 * @target MZ
 * @plugindesc [v1.1.1] 按鍵配置功能（已徹底修復語法錯誤與地圖技能衝突）
 * @author 遊戲開發者 & Gemini
 * @url
 *
 * @param enableKeyConfig
 * @text 啟用按鍵配置功能
 * @type boolean
 * @default true
 *
 * @param optionLabel
 * @text 選項選單的標籤名稱
 * @type string
 * @default 按鍵配置
 *
 * @param allowReset
 * @text 顯示「恢復所有預設值」按鈕
 * @type boolean
 * @default true
 *
 * @help
 * 這是修正版本，完美相容 AP_MapSkillSystem 地圖技能插件。
 * 玩家現在可以在按鍵配置選單中，自由自訂「地圖攻擊」與「切換技能」的按鍵了！
 */

(() => {
    'use strict';

    const PLUGIN_NAME  = 'KeyConfig';
    const params       = PluginManager.parameters(PLUGIN_NAME);
    const ENABLE       = params['enableKeyConfig'] !== 'false';
    const OPTION_LABEL = String(params['optionLabel'] || '按鍵配置');
    const ALLOW_RESET  = params['allowReset'] !== 'false';

    //==========================================================================
    // § 1  可配置功能列表
    //==========================================================================
    const ACTIONS = [
        { id: 'ok',         label: '確認'        },
        { id: 'cancel',     label: '取消'        },
        { id: 'shift',      label: '衝刺 / 特殊'  },
        { id: 'menu',       label: '選單'        },
        { id: 'apMapAtk',   label: '地圖技能：施放' }, 
        { id: 'apMapCycle', label: '地圖技能：切換' }, 
        { id: 'pageup',     label: '上一頁'      },
        { id: 'pagedown',   label: '下一頁'      },
        { id: 'up',         label: '方向：上'     },
        { id: 'down',       label: '方向：下'     },
        { id: 'left',       label: '方向：左'     },
        { id: 'right',      label: '方向：右'     },
    ];

    //==========================================================================
    // § 2  預設按鍵映射
    //==========================================================================
    const DEFAULT_KEY_MAPPER = {
        9:   'tab',       
        13:  'ok',        
        16:  'shift',     
        17:  'control',   
        18:  'control',   
        27:  'escape',    
        32:  'ok',        
        33:  'pageup',    
        34:  'pagedown',  
        37:  'left',      
        38:  'up',        
        39:  'right',     
        40:  'down',      
        45:  'escape',    
        74:  'apMapAtk',   
        75:  'apMapCycle', 
        81:  'pageup',    
        87:  'pagedown',  
        88:  'escape',    
        90:  'ok',        
        96:  'escape',    
        98:  'down',      
        100: 'left',      
        102: 'right',     
        104: 'up',        
        120: 'debug',     
    };

    const DEFAULT_GAMEPAD_MAPPER = {
        0:  'ok',         
        1:  'cancel',     
        2:  'shift',      
        3:  'menu',       
        4:  'pageup',     
        5:  'pagedown',   
        6:  'apMapAtk',    
        7:  'apMapCycle',  
        12: 'up',         
        13: 'down',       
        14: 'left',       
        15: 'right',      
    };

    const KEY_NAMES = {
        8:   'Backspace',   9:   'Tab',         13:  'Enter',
        16:  'Shift',       17:  'Ctrl',        18:  'Alt',
        19:  'Pause',       20:  'CapsLock',    27:  'Esc',
        32:  '空白鍵',       33:  'Page Up',     34:  'Page Down',
        35:  'End',         36:  'Home',        37:  '← 方向鍵',   
        38:  '↑ 方向鍵',    39:  '→ 方向鍵',    40:  '↓ 方向鍵',
        45:  'Insert',      46:  'Delete',
        48:  '0', 49:  '1', 50:  '2', 51:  '3', 52:  '4',
        53:  '5', 54:  '6', 55:  '7', 56:  '8', 57:  '9',
        65:  'A', 66:  'B', 67:  'C', 68:  'D', 69:  'E',
        70:  'F', 71:  'G', 72:  'H', 73:  'I', 74:  'J',
        75:  'K', 76:  'L', 77:  'M', 78:  'N', 79:  'O',
        80:  'P', 81:  'Q', 82:  'R', 83:  'S', 84:  'T',
        85:  'U', 86:  'V', 87:  'W', 88:  'X', 89:  'Y',
        90:  'Z',           91:  'Win',         93:  '選單鍵',
        96:  'Num0',  97:  'Num1',  98:  'Num2',  99:  'Num3',
        100: 'Num4',  101: 'Num5',  102: 'Num6',  103: 'Num7',
        104: 'Num8',  105: 'Num9',
        106: 'Num *', 107: 'Num +', 109: 'Num -',
        110: 'Num .', 111: 'Num /',
        112: 'F1',    113: 'F2',  114: 'F3',  115: 'F4',
        116: 'F5',  117: 'F6',  118: 'F7',  119: 'F8',
        120: 'F9',  121: 'F10', 122: 'F11', 123: 'F12',
        144: 'NumLock',     145: 'ScrollLock',
        186: ';',   187: '=',   188: ',',   189: '-',
        190: '.',   191: '/',   192: '`',
        219: '[',   220: '\\',  221: ']',   222: "'",
    };

    const GAMEPAD_NAMES = {
        0:  'A 鍵',          1:  'B 鍵',
        2:  'X 鍵',          3:  'Y 鍵',
        4:  'LB',            5:  'RB',
        6:  'LT',            7:  'RT',
        8:  'Back / Select', 9:  'Start',
        10: 'L3',            11: 'R3',
        12: '十字↑',         13: '十字↓',
        14: '十字←',         15: '十字→',
    };

    const FORBIDDEN_KEYS = new Set([9, 116, 123]);

    const keyName   = (code) => KEY_NAMES[code]    || `Key ${code}`;
    const gpBtnName = (idx)  => GAMEPAD_NAMES[idx] || `Button ${idx}`;

    function getBoundCodes(action, mapper) {
        return Object.entries(mapper)
            .filter(([, v]) => v === action)
            .map(([k]) => Number(k));
    }

    function bindingLabel(action, mapper, isKeyboard) {
        const codes = getBoundCodes(action, mapper);
        if (!codes.length) return '';
        return isKeyboard
            ? codes.map(keyName).join('  /  ')
            : codes.map(gpBtnName).join('  /  ');
    }

    //==========================================================================
    // § 5  ConfigManager
    //==========================================================================
    ConfigManager.keyMapper     = Object.assign({}, DEFAULT_KEY_MAPPER);
    ConfigManager.gamepadMapper = Object.assign({}, DEFAULT_GAMEPAD_MAPPER);

    const _CM_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function () {
        const data         = _CM_makeData.call(this);
        data.keyMapper     = JsonEx.makeDeepCopy(this.keyMapper);
        data.gamepadMapper = JsonEx.makeDeepCopy(this.gamepadMapper);
        return data;
    };

    const _CM_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        _CM_applyData.call(this, config);
        this.keyMapper = config.keyMapper
            ? JsonEx.makeDeepCopy(config.keyMapper)
            : Object.assign({}, DEFAULT_KEY_MAPPER);
        this.gamepadMapper = config.gamepadMapper
            ? JsonEx.makeDeepCopy(config.gamepadMapper)
            : Object.assign({}, DEFAULT_GAMEPAD_MAPPER);
        this._syncToInput();
    };

    ConfigManager._syncToInput = function () {
        Input.keyMapper     = JsonEx.makeDeepCopy(this.keyMapper);
        Input.gamepadMapper = JsonEx.makeDeepCopy(this.gamepadMapper);
    };

    ConfigManager.resetKeyConfig = function () {
        this.keyMapper     = Object.assign({}, DEFAULT_KEY_MAPPER);
        this.gamepadMapper = Object.assign({}, DEFAULT_GAMEPAD_MAPPER);
        this._syncToInput();
    };

    //==========================================================================
    // § 6  Window_Options
    //==========================================================================
    if (ENABLE) {
        const _WO_makeCommandList = Window_Options.prototype.makeCommandList;
        Window_Options.prototype.makeCommandList = function () {
            _WO_makeCommandList.call(this);
            this.addCommand(OPTION_LABEL, 'keyConfig');
        };

        const _WO_statusText = Window_Options.prototype.statusText;
        Window_Options.prototype.statusText = function (index) {
            if (this.commandSymbol(index) === 'keyConfig') return '';
            return _WO_statusText.call(this, index);
        };

        const _WO_drawItem = Window_Options.prototype.drawItem;
        Window_Options.prototype.drawItem = function (index) {
            if (this.commandSymbol(index) !== 'keyConfig') {
                return _WO_drawItem.call(this, index);
            }
            const rect = this.itemLineRect(index);
            this.resetTextColor();
            this.changePaintOpacity(true);
            this.drawText(this.commandName(index), rect.x, rect.y, rect.width, 'left');
            this.drawText('▶', rect.x, rect.y, rect.width, 'right');
        };

        const _WO_processOk = Window_Options.prototype.processOk;
        Window_Options.prototype.processOk = function () {
            if (this.currentSymbol() === 'keyConfig') {
                this.playOkSound();
                SceneManager.push(Scene_KeyConfig);
            } else {
                _WO_processOk.call(this);
            }
        };

        const _WO_cursorRight = Window_Options.prototype.cursorRight;
        Window_Options.prototype.cursorRight = function (wrap) {
            if (this.currentSymbol() !== 'keyConfig') _WO_cursorRight.call(this, wrap);
        };
        const _WO_cursorLeft = Window_Options.prototype.cursorLeft;
        Window_Options.prototype.cursorLeft = function (wrap) {
            if (this.currentSymbol() !== 'keyConfig') _WO_cursorLeft.call(this, wrap);
        };
    }

    //==========================================================================
    // § 7  Scene_KeyConfig
    //==========================================================================
    class Scene_KeyConfig extends Scene_MenuBase {
        initialize() {
            super.initialize();
            this._wKey = JsonEx.makeDeepCopy(ConfigManager.keyMapper);
            this._wGp  = JsonEx.makeDeepCopy(ConfigManager.gamepadMapper);
            this._listenMode   = null;
            this._listenAction = null;
            this._listenLabel  = '';
            this._rawKeyFn     = null;
            this._gpSnap       = null;
            this._gpWait       = 0;
            this._currentMode  = 'keyboard';
        }

        create() {
            super.create();
            this.createHelpWindow();
            this.createModeWindow();
            this.createListWindow();
            this.createListenWindow();
            this._modeWindow.activate();
            this._modeWindow.select(0);
            this._refreshHelp();
        }

        createHelpWindow() {
            this._helpWindow = new Window_Help(this._helpRect());
            this.addWindow(this._helpWindow);
        }

        _helpRect() {
            return new Rectangle(0, 0, Graphics.boxWidth, this.calcWindowHeight(1, false));
        }

        _refreshHelp() {
            let text = '';
            if (this._listenMode) {
                text = '請按下新的按鍵或手把按鈕 │ 按【Esc】取消本次更改';
            } else if (this._listWindow && this._listWindow.active) {
                const m = this._currentMode === 'keyboard' ? '鍵盤模式' : '手把模式';
                text = `【${m}】選擇功能後按【確認】更改 │ 按【取消】回上一層`;
            } else {
                text = '選擇要設定的輸入裝置 │ 按【取消】儲存設定並返回選項';
            }
            this._helpWindow.setText(text);
        }

        createModeWindow() {
            const numLines = ALLOW_RESET ? 3 : 2;
            const wh       = this.calcWindowHeight(numLines, true);
            const ww       = 360;
            const helpH    = this._helpWindow.height;
            const rect = new Rectangle(
                Math.floor((Graphics.boxWidth  - ww) / 2),
                Math.floor(helpH + (Graphics.boxHeight - helpH - wh) / 2),
                ww, wh
            );
            this._modeWindow = new Window_KeyConfigMode(rect);
            this._modeWindow.setHandler('keyboard', this._onModeSelect.bind(this, 'keyboard'));
            this._modeWindow.setHandler('gamepad',  this._onModeSelect.bind(this, 'gamepad'));
            if (ALLOW_RESET) {
                this._modeWindow.setHandler('reset', this._onReset.bind(this));
            }
            this._modeWindow.setHandler('cancel', this._saveAndExit.bind(this));
            this.addWindow(this._modeWindow);
        }

        createListWindow() {
            const helpH = this._helpWindow.height;
            const rect  = new Rectangle(0, helpH, Graphics.boxWidth, Graphics.boxHeight - helpH);
            this._listWindow = new Window_KeyConfigList(rect);
            this._listWindow.setHandler('ok',     this._onListOk.bind(this));
            this._listWindow.setHandler('cancel', this._onListCancel.bind(this));
            this._listWindow.hide();
            this._listWindow.deactivate();
            this.addWindow(this._listWindow);
        }

        createListenWindow() {
            const ww  = 460;
            const wh  = this.calcWindowHeight(4, true);
            const rect = new Rectangle(
                Math.floor((Graphics.boxWidth  - ww) / 2),
                Math.floor((Graphics.boxHeight - wh) / 2),
                ww, wh
            );
            this._listenWin = new Window_KeyConfigListening(rect);
            this._listenWin.hide();
            this.addWindow(this._listenWin);
        }

        _workMapper(mode) {
            return mode === 'keyboard' ? this._wKey : this._wGp;
        }

        _onModeSelect(mode) {
            this._currentMode = mode;
            this._modeWindow.hide();
            this._modeWindow.deactivate();
            this._listWindow.setup(mode, this._workMapper(mode));
            this._listWindow.show();
            this._listWindow.activate();
            this._listWindow.select(0);
            this._refreshHelp();
        }

        _onReset() {
            this._wKey = Object.assign({}, DEFAULT_KEY_MAPPER);
            this._wGp  = Object.assign({}, DEFAULT_GAMEPAD_MAPPER);
            Input.keyMapper     = Object.assign({}, DEFAULT_KEY_MAPPER);
            Input.gamepadMapper = Object.assign({}, DEFAULT_GAMEPAD_MAPPER);
            SoundManager.playOk();
            this._listWindow.setup(this._currentMode, this._workMapper(this._currentMode));
            this._listWindow.refresh();
            this._modeWindow.activate();
        }

        _saveAndExit() {
            ConfigManager.keyMapper     = JsonEx.makeDeepCopy(this._wKey);
            ConfigManager.gamepadMapper = JsonEx.makeDeepCopy(this._wGp);
            ConfigManager._syncToInput();
            ConfigManager.save();
            this.popScene();
        }

        _onListOk() {
            const item = this._listWindow.currentItem();
            if (!item) return;
            this._startListening(item.id, item.label);
        }

        _onListCancel() {
            this._listWindow.hide();
            this._listWindow.deactivate();
            this._modeWindow.show();
            this._modeWindow.activate();
            this._refreshHelp();
        }

        _startListening(actionId, label) {
            this._listenMode   = this._currentMode;
            this._listenAction = actionId;
            this._listenLabel  = label;
            this._listenWin.setup(label, this._currentMode);
            this._listenWin.show();
            this._listWindow.deactivate();
            this._refreshHelp();
            if (this._currentMode === 'keyboard') {
                this._rawKeyFn = this._onRawKeyDown.bind(this);
                window.addEventListener('keydown', this._rawKeyFn, true);
            } else {
                this._gpSnap = this._snapshotGamepad();
                this._gpWait = 8;
            }
        }

        _onRawKeyDown(e) {
            const code = e.keyCode;
            e.preventDefault();
            e.stopPropagation();
            if (code === 27) {
                this._cancelListening();
                return;
            }
            if (FORBIDDEN_KEYS.has(code)) {
                SoundManager.playBuzzer();
                return;
            }
            this._removeRawKeyHandler();
            this._applyKeyBind(code);
        }

        _removeRawKeyHandler() {
            if (this._rawKeyFn) {
                window.removeEventListener('keydown', this._rawKeyFn, true);
                this._rawKeyFn = null;
            }
        }

        _applyKeyBind(keyCode) {
            const mapper = this._wKey;
            const action = this._listenAction;
            if (mapper[keyCode] !== undefined && mapper[keyCode] !== action) {
                delete mapper[keyCode];
            }
            mapper[keyCode] = action;
            Input.keyMapper = JsonEx.makeDeepCopy(mapper);
            SoundManager.playOk();
            this._finishListening();
        }

        _cancelListening() {
            this._removeRawKeyHandler();
            this._finishListening();
        }

        _finishListening() {
            this._listenMode = null;
            this._listenAction = null;
            this._listenWin.hide();
            this._listWindow.setup(this._currentMode, this._workMapper(this._currentMode));
            this._listWindow.activate();
            this._refreshHelp();
        }

        _snapshotGamepad() {
            const gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
            if (!gamepad) return [];
            return gamepad.buttons.map(b => b.pressed);
        }
    }

    class Window_KeyConfigMode extends Window_Command {
        makeCommandList() {
            this.addCommand('鍵盤設定', 'keyboard');
            this.addCommand('手把設定', 'gamepad');
            if (ALLOW_RESET) this.addCommand('恢復所有預設值', 'reset');
        }
    }

    class Window_KeyConfigList extends Window_Selectable {
        constructor(rect) { super(rect); this._data = ACTIONS; this.refresh(); }
        setup(mode, mapper) { this._mode = mode; this._mapper = mapper; this.refresh(); }
        maxItems() { return this._data ? this._data.length : 0; }
        currentItem() { return this._data[this.index()]; }
        drawItem(index) {
            const item = this._data[index];
            const rect = this.itemLineRect(index);
            this.drawText(item.label, rect.x, rect.y, rect.width / 2);
            if (this._mapper) {
                const label = bindingLabel(item.id, this._mapper, this._mode === 'keyboard');
                this.drawText(label, rect.x + rect.width / 2, rect.y, rect.width / 2, 'right');
            }
        }
    }

    class Window_KeyConfigListening extends Window_Base {
        setup(label, mode) {
            this.contents.clear();
            this.drawText(`正在設定【${label}】功能`, 0, 0, this.contentsWidth(), 'center');
            this.drawText('請按下你想綁定的按鍵...', 0, this.lineHeight(), this.contentsWidth(), 'center');
            this.drawText('按【Esc】可以取消', 0, this.lineHeight() * 2, this.contentsWidth(), 'center');
        }
    }
})();