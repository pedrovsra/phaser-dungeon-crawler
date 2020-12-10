import Phaser from 'phaser'

export default class Chest extends Phaser.Physics.Arcade.Sprite {
    get coins() {
        if (this.anims.currentAnim.key !== 'chest-closed') return 0

        return Phaser.Math.Between(50, 200)
    }

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
        super(scene, x, y, texture, frame)

        this.play('chest-closed')
    }

    open() {
        this.play('chest-open')
    }
}