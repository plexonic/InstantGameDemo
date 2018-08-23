import "phaser";
import {Scene1} from "./Scene1";

const config: GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: {y: 200}
        }
    },
    scene: Scene1
};

export class Game extends Phaser.Game {
    constructor(config: GameConfig) {
        super(config);
    }
}

FBInstant.initializeAsync().then(() => {
    console.log("hi there");
    FBInstant.logEvent();
    FBInstant.startGameAsync().then(() => {
        const game = new Phaser.Game(config);
    })
});

