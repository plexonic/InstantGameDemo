import {config, gameOptions} from "./Game";
import Pointer = Phaser.Input.Pointer;
import Point = Phaser.Geom.Point;
import AdInstance = FBInstant.AdInstance;


enum Direction {
    LEFT = 0,
    RIGHT = 1,
    UP = 2,
    DOWN = 3,
}

export class PlayScene extends Phaser.Scene {
    private boardMatrix: any[][];
    private canMove: boolean;
    private movingTiles: number;
    private moveSound: Phaser.Sound.BaseSound;
    private growSound: Phaser.Sound.BaseSound;
    private score: number;
    private scoreText: Phaser.GameObjects.BitmapText;
    private bestScore: number | null;
    private bestScoreText: Phaser.GameObjects.BitmapText;
    private interstitialAd: FBInstant.AdInstance;
    private rewardedVideoAd: FBInstant.AdInstance;

    constructor() {
        super({key: "PlayScene"})
    }

    preload() {
        this.load.image("restart", "assets/sprites/restart.png");
        this.load.image("gametitle", "assets/sprites/gametitle.png");
        this.load.image("scorepanel", "assets/sprites/scorepanel.png");
        this.load.image("scorelabels", "assets/sprites/scorelabels.png");
        this.load.image("logo", "assets/sprites/logo.png");
        this.load.image("howtoplay", "assets/sprites/howtoplay.png");
        this.load.image("emptytyle", "assets/sprites/emptytile.png");
        this.load.spritesheet("tiles", "assets/sprites/tiles.png", {
            frameWidth: gameOptions.tileSize,
            frameHeight: gameOptions.tileSize
        });
        this.load.audio("move", ["assets/sounds/move.mp3", "assets/sounds/move.ogg"]);
        this.load.audio("grow", ["assets/sounds/grow.mp3", "assets/sounds/grow.ogg"]);
        this.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
        FBInstant.getInterstitialAdAsync(gameOptions.interstitialId)
            .then((adInstance: AdInstance) => {
                this.interstitialAd = adInstance;
                this.interstitialAd.loadAsync().catch(reason => console.log(reason));
            });
        FBInstant.getRewardedVideoAsync(gameOptions.rewardedVideoId)
            .then((adInstance: AdInstance) => {
                this.rewardedVideoAd = adInstance;
                this.rewardedVideoAd.loadAsync().catch(reason => console.log(reason));
            });
    }

    create() {
        this.loadControlObjects();
        this.loadScore();
        this.score = 0;
        this.canMove = false;
        this.boardMatrix = [];
        this.moveSound = this.sound.add("move");
        this.growSound = this.sound.add("grow");
        for (let i = 0; i < gameOptions.boardSize.rows; i++) {
            this.boardMatrix[i] = [];
            for (let j = 0; j < gameOptions.boardSize.cols; j++) {
                const tilePosition: Point = PlayScene.getTilePosition(i, j);
                this.add.image(tilePosition.x, tilePosition.y, "emptytyle");
                const tile = this.add.sprite(tilePosition.x, tilePosition.y, "tiles", 0);
                tile.visible = false;
                this.boardMatrix[i][j] = {
                    tileValue: 0,
                    tileSprite: tile,
                    upgraded: false
                }
            }
        }
        this.addTile();
        this.addTile();
        this.input.keyboard.on("keydown", this.handleKey, this);
        this.input.on("pointerup", this.handleSwipe, this);
    }

    loadControlObjects() {
        const restartXY: Point = PlayScene.getTilePosition(-0.8, gameOptions.boardSize.cols - 1);
        const restartButton: Phaser.GameObjects.Sprite = this.add.sprite(restartXY.x, restartXY.y, "restart");
        restartButton.setInteractive();
        restartButton.on("pointerdown", () => {
            this.scene.start("PlayScene");
        });
        const scoreXY: Point = PlayScene.getTilePosition(-0.8, 1);
        this.add.image(scoreXY.x, scoreXY.y, "scorepanel");
        this.add.image(scoreXY.x, scoreXY.y - 70, "scorelabels");
        const gameTitle: Phaser.GameObjects.Image = this.add.image(10, 5, "gametitle");
        gameTitle.setOrigin(0, 0);
        const howTo: Phaser.GameObjects.Image = this.add.image(config.width, 5, "howtoplay");
        howTo.setOrigin(1, 0);
        const logo: Phaser.GameObjects.Sprite = this.add.sprite(config.width / 2, config.height, "logo");
        logo.setOrigin(0.5, 1);
        logo.setInteractive();
        logo.on("pointerdown", function(){
            window.location.href = "https://www.facebook.com/instantgames/2141997102694997"
        });
    }

    loadScore() {
        const scoreXY: Point = PlayScene.getTilePosition(-0.8, 1);
        this.add.image(scoreXY.x, scoreXY.y, "scorepanel");
        this.add.image(scoreXY.x, scoreXY.y - 70, "scorelabels");
        let textXY: Point = PlayScene.getTilePosition(-0.92, -0.4);
        this.scoreText = this.add.bitmapText(textXY.x, textXY.y, "font", "0");
        textXY = PlayScene.getTilePosition(-0.92, 1.1);
        this.bestScore = localStorage.getItem(gameOptions.localStorageName) == null ? null : parseInt(localStorage.getItem(gameOptions.localStorageName), 10);
        if (this.bestScore == null) {
            this.bestScore = 0;
        }
        this.bestScoreText = this.add.bitmapText(textXY.x, textXY.y, "font", this.bestScore.toString());
    }

    addTile() {
        let emptyTiles: object[] = [];
        for (let i = 0; i < gameOptions.boardSize.rows; i++) {
            for (let j = 0; j < gameOptions.boardSize.cols; j++) {
                if (this.boardMatrix[i][j].tileValue == 0) {
                    emptyTiles.push({
                        row: i,
                        col: j
                    });
                }
            }
        }
        if (emptyTiles.length > 0) {
            const chosenTile: any = Phaser.Utils.Array.GetRandom(emptyTiles);
            const element: any = this.boardMatrix[chosenTile.row][chosenTile.col];
            element.tileValue = 1;
            const sprite = element.tileSprite;
            sprite.visible = true;
            sprite.setFrame(0);
            sprite.alpha = 0;
            this.tweens.add({
                targets: [sprite],
                alpha: 1,
                duration: gameOptions.tweenSpeed,
                onComplete: () => {
                    this.canMove = true;
                }
            });
        }
    }

    static getTilePosition(row: integer, col: integer): Point {
        const posX = gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
        let posY = gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);
        let boardHeight = gameOptions.boardSize.rows * gameOptions.tileSize;
        boardHeight += (gameOptions.boardSize.rows + 1) * gameOptions.tileSpacing;
        posY += (config.height - boardHeight) / 2;
        return new Point(posX, posY);
    }

    handleKey(e: KeyboardEvent): void {
        if (!this.canMove) {
            return;
        }
        switch (e.code) {
            case "KeyA":
            case "ArrowLeft":
                this.makeMove(Direction.LEFT);
                break;
            case "KeyD":
            case "ArrowRight":
                this.makeMove(Direction.RIGHT);
                break;
            case "KeyW":
            case "ArrowUp":
                this.makeMove(Direction.UP);
                break;
            case "KeyS":
            case "ArrowDown":
                this.makeMove(Direction.DOWN);
                break;
            default:
                return;
        }
    }

    handleSwipe(e: Pointer): void {
        if (!this.canMove) {
            return;
        }
        const swipeTime = e.upTime - e.downTime;
        const fastEnough = swipeTime < gameOptions.swipeMaxTime;
        const swipe = new Point(e.upX - e.downX, e.upY - e.downY);
        const swipeMagnitude = Point.GetMagnitude(swipe);
        const longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
        if (longEnough && fastEnough) {
            Point.SetMagnitude(swipe, 1);
            const swipeMinNormal = gameOptions.swipeMinNormal;
            if (swipe.x > swipeMinNormal) {
                this.makeMove(Direction.RIGHT);
            }
            if (swipe.x < -swipeMinNormal) {
                this.makeMove(Direction.LEFT);
            }
            if (swipe.y > swipeMinNormal) {
                this.makeMove(Direction.DOWN);
            }
            if (swipe.y < -swipeMinNormal) {
                this.makeMove(Direction.UP);
            }
        }
    }

    makeMove(d: Direction): void {
        this.canMove = false;
        this.movingTiles = 0;
        const dRow = (d == Direction.LEFT || d == Direction.RIGHT) ? 0 : d == Direction.UP ? -1 : 1;
        const dCol = (d == Direction.UP || d == Direction.DOWN) ? 0 : d == Direction.LEFT ? -1 : 1;
        const firstRow = (d == Direction.UP) ? 1 : 0;
        const lastRow = gameOptions.boardSize.rows - ((d == Direction.DOWN) ? 1 : 0);
        const firstCol = (d == Direction.LEFT) ? 1 : 0;
        const lastCol = gameOptions.boardSize.cols - ((d == Direction.RIGHT) ? 1 : 0);
        for (let i = firstRow; i < lastRow; i++) {
            for (let j = firstCol; j < lastCol; j++) {
                const curRow = dRow == 1 ? (lastRow - 1) - i : i;
                const curCol = dCol == 1 ? (lastCol - 1) - j : j;
                let tileValue = this.boardMatrix[curRow][curCol].tileValue;
                if (tileValue != 0) {
                    let newRow = curRow;
                    let newCol = curCol;
                    while (this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)) {
                        newRow += dRow;
                        newCol += dCol;
                    }

                    if (newRow != curRow || newCol != curCol) {
                        const newPos = PlayScene.getTilePosition(newRow, newCol);
                        const willUpdate = this.boardMatrix[newRow][newCol].tileValue == tileValue;
                        this.moveTile(this.boardMatrix[curRow][curCol].tileSprite, newPos, willUpdate);
                        this.boardMatrix[curRow][curCol].tileValue = 0;
                        if (willUpdate) {
                            this.boardMatrix[newRow][newCol].tileValue++;
                            this.boardMatrix[newRow][newCol].upgraded = true;
                            this.score += Math.pow(2, this.boardMatrix[newRow][newCol].tileValue);
                        }
                        else {
                            this.boardMatrix[newRow][newCol].tileValue = tileValue;
                        }
                    }
                }
            }
        }
        if (this.movingTiles == 0) {
            this.canMove = true;
        } else {
            this.moveSound.play();
        }
    }

    moveTile(tile: any, point: Point, upgrade: boolean) {
        this.movingTiles++;
        tile.depth = this.movingTiles;
        const distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
        this.tweens.add({
            targets: [tile],
            x: point.x,
            y: point.y,
            duration: gameOptions.tweenSpeed * distance / gameOptions.tileSize,
            callbackScope: this,
            onComplete: () => {
                if (upgrade) {
                    this.upgradeTile(tile);
                }
                else {
                    this.endTween(tile);
                }
            }
        })
    }

    refreshBoard(): void {
        this.scoreText.text = this.score.toString();
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(gameOptions.localStorageName, this.bestScore.toString());
            this.bestScoreText.text = this.bestScore.toString();
        }
        for (let i = 0; i < gameOptions.boardSize.rows; i++) {
            for (let j = 0; j < gameOptions.boardSize.cols; j++) {
                const spritePosition = PlayScene.getTilePosition(i, j);
                this.boardMatrix[i][j].tileSprite.x = spritePosition.x;
                this.boardMatrix[i][j].tileSprite.y = spritePosition.y;
                const tileValue = this.boardMatrix[i][j].tileValue;
                if (tileValue > 0) {
                    this.boardMatrix[i][j].tileSprite.visible = true;
                    this.boardMatrix[i][j].tileSprite.setFrame(tileValue - 1);
                    this.boardMatrix[i][j].upgraded = false;
                }
                else {
                    this.boardMatrix[i][j].tileSprite.visible = false;
                }
            }
        }
        if (this.score == 8) {
            this.interstitialAd.showAsync()
                .catch(reason => console.log(reason));
        }
        if (this.score > 32 && this.score < 36) {
            this.rewardedVideoAd.showAsync()
                .catch(reason => console.log(reason));
        }
        this.addTile();
    }

    upgradeTile(tile: any) {
        this.growSound.play();
        tile.setFrame(tile.frame.name + 1);
        this.tweens.add({
            targets: [tile],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: gameOptions.tweenSpeed,
            yoyo: true,
            repeat: 1,
            callbackScope: this,
            onComplete: () => {
                this.endTween(tile);
            }
        })
    }

    endTween(tile: any) {
        this.movingTiles--;
        tile.depth = 0;
        if (this.movingTiles == 0) {
            this.refreshBoard();
        }
    }

    isLegalPosition(row: integer, col: integer, value: integer): boolean {
        const rowInside: boolean = row >= 0 && row < gameOptions.boardSize.rows;
        const colInside: boolean = col >= 0 && col < gameOptions.boardSize.cols;
        if (!rowInside || !colInside || this.boardMatrix[row][col].tileValue == 12) {
            return false;
        }
        const emptySpot = this.boardMatrix[row][col].tileValue == 0;
        const sameValue = this.boardMatrix[row][col].tileValue == value;
        const alreadyUpgraded = this.boardMatrix[row][col].upgraded;
        return emptySpot || (sameValue && !alreadyUpgraded);
    }
}
