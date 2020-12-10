import Phaser from 'phaser'

import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import { createChestAnims } from '../anims/TreasureAnims'

import Faune from '../characters/Faune'
import Lizard from '~/enemies/Lizard'

import '../characters/Faune'

import { sceneEvents } from '../events/EventsCenter'

export default class Game extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private faune!: Faune

    private knives!: Phaser.Physics.Arcade.Group
    private lizards!: Phaser.Physics.Arcade.Group

    private playerLizardsCollider?: Phaser.Physics.Arcade.Collider

    constructor() {
        super('game')
    }

    preload() {
        this.cursors = this.input.keyboard.createCursorKeys()
    }

    create() {
        this.scene.run('game-ui')

        createCharacterAnims(this.anims)
        createLizardAnims(this.anims)
        createChestAnims(this.anims)

        const map = this.make.tilemap({ key: 'dungeon' })
        const tileset = map.addTilesetImage('dungeon', 'tiles', 16, 16, 1, 2)

        map.createStaticLayer('Ground', tileset)
        const wallsLayer = map.createStaticLayer('Walls', tileset)
        wallsLayer.setCollisionByProperty({ collides: true })

        const chests = this.physics.add.staticGroup()
        const chestsLayer = map.getObjectLayer('Chests')
        chestsLayer.objects.forEach(e => {
            chests.get(e.x! + e.width! / 2, e.y! - e.height! / 2, 'treasure', 'chest_empty_open_anim_f0.png')
        });

        this.knives = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image
        })

        this.faune = this.add.faune(128, 128, 'faune', 'walk-down-3.png')
        this.faune.setKnives(this.knives)

        this.cameras.main.startFollow(this.faune, true)

        this.lizards = this.physics.add.group({
            classType: Lizard,
            createCallback: (go) => {
                const lizGo = go as Lizard
                lizGo.body.onCollide = true
            }
        })

        this.lizards.get(256, 128, 'lizard')

        this.physics.add.collider(this.faune, wallsLayer)
        this.physics.add.collider(this.lizards, wallsLayer)
        this.physics.add.collider(this.faune, chests)
        this.physics.add.collider(this.knives, wallsLayer, this.handleKnifeWallCollision, undefined, this)
        this.physics.add.collider(this.knives, this.lizards, this.handleKnifeLizardCollision, undefined, this)

        this.playerLizardsCollider = this.physics.add.collider(this.lizards, this.faune, this.handlePlayerLizardCollision, undefined, this)
    }

    private handleKnifeLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        this.knives.killAndHide(obj1)

        const lizard = obj2 as Lizard
        lizard.disableBody()

        this.lizards.killAndHide(obj2)

    }

    private handleKnifeWallCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        this.knives.killAndHide(obj1)
    }

    private handlePlayerLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const lizard = obj2 as Lizard

        const dx = this.faune.x - lizard.x
        const dy = this.faune.y - lizard.y

        const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200)

        this.faune.handleDamage(dir)

        sceneEvents.emit('player-health-changed', this.faune.health)

        if (this.faune.health <= 0) {
            this.playerLizardsCollider?.destroy()
        }
    }

    update(t: number, dt: number) {
        if (this.faune) this.faune.update(this.cursors)
    }
}
