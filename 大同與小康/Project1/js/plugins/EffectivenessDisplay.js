/*:
 * @target MZ
 * @plugindesc Dodaje informacje o efektywności ataku w zależności od odporności lub podatności przeciwnika.
 * @help 
 * Ten plugin dodaje informacje o efektywności ataku (zielony napis "efektowny atak", czerwony napis "słaby atak" lub szary napis "neutralny atak").
 */

(() => {
    const parameters = PluginManager.parameters('ShowEnemyAttackEffectiveness');

    // Extend Sprite_Enemy to include attack effectiveness feature
    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);
        this.updateAttackEffectiveness();
    };

    Sprite_Enemy.prototype.updateAttackEffectiveness = function() {
        if (this._battler && this._battler.isSelected() && BattleManager.actor()) {
            const action = BattleManager.actor().currentAction();
            if (action && action.item()) {
                const elementId = action.item().damage.elementId;
                const effectiveness = this._battler.elementRate(elementId);
                if (effectiveness > 1.0) {
                    this.showEffectiveAttack();
                } else if (effectiveness < 1.0) {
                    this.showWeakAttack();
                } else {
                    this.showNeutralAttack();
                }
            } else {
                this.showNeutralAttack();
            }
        } else {
            this.hideAttackMessage();
        }
    };

    Sprite_Enemy.prototype.showEffectiveAttack = function() {
        this.showAttackMessage('Efektowny atak', '#00FF00'); // Green color
    };

    Sprite_Enemy.prototype.showWeakAttack = function() {
        this.showAttackMessage('Słaby atak', '#FF0000'); // Red color
    };

    Sprite_Enemy.prototype.showNeutralAttack = function() {
        this.showAttackMessage('Neutralny atak', '#FFFFFF'); // Gray color
    };

    Sprite_Enemy.prototype.showAttackMessage = function(text, color) {
        if (!this._effectivenessSprite) {
            this._effectivenessSprite = this.createAttackSprite();
        }
        this._effectivenessSprite.bitmap.clear();
        this._effectivenessSprite.bitmap.textColor = color;
        this._effectivenessSprite.bitmap.fontSize = 20;
        this._effectivenessSprite.bitmap.drawText(text, 0, 0, 160, 32, 'center');
        this.updateAttackSpritePosition();
        this._effectivenessSprite.visible = true;
        this.parent.addChild(this._effectivenessSprite);
    };

    Sprite_Enemy.prototype.hideAttackMessage = function() {
        if (this._effectivenessSprite) {
            this._effectivenessSprite.visible = false;
            this.parent.removeChild(this._effectivenessSprite);
        }
    };

    Sprite_Enemy.prototype.createAttackSprite = function() {
        const sprite = new Sprite(new Bitmap(160, 32));
        sprite.anchor.set(0.5, 1);
        return sprite;
    };

    Sprite_Enemy.prototype.updateAttackSpritePosition = function() {
        if (this._effectivenessSprite) {
            const centerX = this.x - 321 + this.width / 2;
            const centerY = this.y;
            this._effectivenessSprite.x = centerX;
            this._effectivenessSprite.y = centerY - 40; // Adjusted position above the enemy sprite
        }
    };
})();
