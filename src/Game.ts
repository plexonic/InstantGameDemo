import "phaser";
import {PlayScene} from "./PlayScene";


export const gameOptions: any = {
    tileSize: 200,
    tileSpacing: 20,
    boardSize: {
        rows: 4,
        cols: 4
    },
    tweenSpeed: 50,
    swipeMaxTime: 1000,
    swipeMinDistance: 20,
    swipeMinNormal: 0.85,
    aspectRatio: 16 / 9,
    localStorageName: "topscore4096",
    interstitialId: "866170650250506_892511647616406",
    rewardedVideoId: "866170650250506_892853464248891"
};
const tileAndSpacing = gameOptions.tileSize + gameOptions.tileSpacing;
const width = gameOptions.boardSize.cols * tileAndSpacing + gameOptions.tileSpacing;
export const config: GameConfig = {
    type: Phaser.AUTO,
    width: width,
    height: width * gameOptions.aspectRatio,
    backgroundColor: 0xecf0f1,
    scene: PlayScene
};

export class Game extends Phaser.Game {
    constructor(config: GameConfig) {
        super(config);
    }
}

FBInstant.initializeAsync().then(() => {
    FBInstant.startGameAsync().then(() => {
        this.game = new Phaser.Game(config);
        window.focus();
        resizeGame();
        window.addEventListener("resize", resizeGame);
    }).catch((reason: any) => console.log(reason));
});


function resizeGame() {
    const canvas = document.querySelector("canvas");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio: number = config.width / config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}