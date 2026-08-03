import Enemy from '../Enemy';
import UI from '../../base/UI';
import Weapon from '../Weapon';
import Player from '../Player';
import Level from '../../base/Level';

export default class FirstLevel extends Level {

    setProperties() {

        this.menu = null;
        this.weapon = null;
        this.ammoBox = null;
        this.mapRoot = null;

        this.player = new Player(this);
        this.playerMesh = null;
        this.playerLife = 100;

        this.maxEnemies = 10;
        this.currentEnemies = 0;
        this.enemies = [];
        this.enemyDistanceFromCenter = 100;

        this.mobileFireButton = null;
    }

    setupAssets() {

        this.assets.addAnimatedMesh('rifle', 'assets/models/weapons/rifle/rifle.gltf', {
            'normalized': true,
            'start': 0,
            'end': 207
        });
        
        this.assets.addMergedMesh('enemy', 'assets/models/skull/skull2.obj');

        this.assets.addMusic('music', 'assets/musics/music.mp3', { volume: 0.1 });
        this.assets.addSound('shotgun', 'assets/sounds/shotgun.wav', { volume: 0.4 });
        this.assets.addSound('reload', 'assets/sounds/reload.mp3', { volume: 0.4 });
        this.assets.addSound('empty', 'assets/sounds/empty.wav', { volume: 0.4 });
        this.assets.addSound('monsterAttack', 'assets/sounds/monster_attack.wav', { volume: 0.3 });
        this.assets.addSound('playerDamaged', 'assets/sounds/damage.wav', { volume: 0.3 });
        
    }

    async buildScene() {
        
        this.scene.clearColor = new BABYLON.Color3.FromHexString('#777');
        
        let dirLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 0), this.scene);
        dirLight.intensity = 0.3;

        let hemiLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0.5;

        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, this.scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skybox/skybox", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;

        this.scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.scene.collisionsEnabled = true;

        this.camera = this.createCamera();
        this.scene.activeCamera = this.camera;
        this.enablePointerLock();
        
        this.createGround();
        this.addWeapon();

        await this.addMap();
        
        this.addEnemies();

        this.createHUD();
        this.createMenu();
        
        setInterval(() => {
            this.addEnemies();
        }, 1000 * 25);

        this.setupEventListeners();

        this.player.startTimeCounter();
    }

    createGround() {
        let ground = BABYLON.Mesh.CreateGround('ground', 500, 500, 2, this.scene);
        ground.checkCollisions = true;
        
        let groundMaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture('assets/images/sand.jpg', this.scene);
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        ground.material = groundMaterial;
    }

    async addMap() {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "assets/maps/",
            "scene1.glb",
            this.scene
        );

        const root = result.meshes[0];
        root.position = new BABYLON.Vector3(0, 0, 0);
        root.scaling = new BABYLON.Vector3(1, 1, 1);

        result.meshes.forEach(mesh => {
            mesh.checkCollisions = true;
            mesh.receiveShadows = true;
        });

        this.mapRoot = root;
    }

    addWeapon() {
        this.weapon = new Weapon(this);
        this.weapon.create();
    }

    addEnemies() {
        this.removeUnnecessaryEnemies();

        let quantityOfEnemiesToCreate = this.maxEnemies - this.currentEnemies;

        for(var enemiesQuantity = 0; enemiesQuantity < quantityOfEnemiesToCreate; enemiesQuantity++) {
            let enemy = new Enemy(this).create();

            this.enemies.push(enemy);
            this.currentEnemies++;
        }

        this.maxEnemies += 1;
        this.enemyDistanceFromCenter += 10;
    }

    removeUnnecessaryEnemies() {
        let enemiesQuantity = this.enemies.length;

        for(var i = 0; i < enemiesQuantity; i++) {
            if(this.enemies[i] && !this.enemies[i].mesh) {
                this.enemies.splice(i, 1);
            }
        }
    }

    setupEventListeners() {
        GAME.canvas.addEventListener('click', () => {
            if (this.weapon) {
                this.weapon.fire();
            }
        }, false);
    }

    createHUD() {
        var hud = new UI('levelUI');
        
        hud.addImage('gunsight', 'assets/images/gunsight.png', {
            'width': 0.05,
            'height': 0.05
        });

        this.lifeTextControl = hud.addText('Life: ' + this.playerLife, {
            'top': '10px',
            'left': '10px',
            'horizontalAlignment': BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
        });

        this.ammoTextControl = hud.addText('Ammo: ' + this.weapon.ammo, {
            'top': '10px',
            'left': '10px',
            'horizontalAlignment': BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
        });

        this.hitsTextControl = hud.addText('Hits: ' + this.player.hits, {
            'top': '10px',
            'left': '-10px',
            'horizontalAlignment': BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
        });
    }

    createMenu() {
        this.menu = new UI('runnerMenuUI');

        this.pointsTextControl = this.menu.addText('Points: 0', {
            'top': '-200px',
            'outlineWidth': '2px',
            'fontSize': '40px',
            'verticalAlignment': BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
        });

        this.currentRecordTextControl = this.menu.addText('Current Record: 0', {
            'top': '-150px',
            'verticalAlignment': BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
        });

        this.hasMadeRecordTextControl = this.menu.addText('You got a new Points Record!', {
            'top': '-100px',
            'color': GAME.options.recordTextColor,
            'fontSize': '20px',
            'verticalAlignment': BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
        });

        this.gameOverTextControl = this.menu.addText('GAME OVER', {
            'top': '-60px',
            'color': GAME.options.recordTextColor,
            'fontSize': '25px',
            'verticalAlignment': BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER
        });

        this.menu.addButton('replayButton', 'Replay Game', {
            'onclick': () => this.replay()
        });

        this.menu.addButton('backButton', 'Return to Home', {
            'top': '70px',
            'onclick': () => GAME.goToLevel('HomeMenuLevel')
        });

        if (GAME.isMobile()) {
            this.mobileFireButton = this.menu.addButton('fireButton', 'FIRE', {
                'top': '140px',
                'background': 'rgba(255,255,255,0.15)',
                'color': 'white',
                'width': '140px',
                'height': '60px',
                'onclick': () => {
                    if (this.weapon) {
                        this.weapon.fire();
                    }
                }
            });
        }

        this.menu.hide();
    }

    createCamera() {
        var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 3.5, 100), this.scene);
        camera.setTarget(new BABYLON.Vector3(0,2,0));
        
        camera.attachControl(GAME.canvas, true);
        
        camera.applyGravity = true;
        camera.ellipsoid = new BABYLON.Vector3(1, 1.7, 1);
        camera.checkCollisions = true;
        camera._needMoveForGravity = true;

        camera.minZ = 0;

        camera.keysUp = [87, 38];
        camera.keysDown = [83, 40];
        camera.keysLeft = [65, 37];
        camera.keysRight = [68, 39];

        camera.inertia = 0.1;
        camera.angularSensibility = 800;
        camera.speed = 17;
        
        camera.onCollide = (collidedMesh) => {
            if(collidedMesh.id == 'ammoBox') {
                this.weapon.reload();
                collidedMesh.dispose();
                collidedMesh.arrow.dispose();
            }
        }
        
        return camera;
    }

    playerWasAttacked() {
        this.playerLife -= 5;
        
        if(this.playerLife <= 0) {
            this.playerLife = 0;
            this.lifeTextControl.text = 'Life: ' + this.playerLife;

            this.gameOver();

            return;
        }
        
        this.lifeTextControl.text = 'Life: ' + this.playerLife;
        this.assets.getSound('playerDamaged').play();
    }

    playerHitEnemy() {
        this.currentEnemies--;
        this.player.hits++;
        this.hitsTextControl.text = 'Hits: ' + this.player.hits;
    }

    ammoIsOver() {
        this.addAmmoBox();
    }

    addAmmoBox() {
        this.ammoBox = BABYLON.MeshBuilder.CreateBox(
            'ammoBox', 
            { 'width': 4, 'height': 2, 'depth': 2 }, 
            this.scene
        );
        
        this.ammoBox.position.x = 0;
        this.ammoBox.position.y = 1;
        this.ammoBox.position.z = 0;

        this.ammoBox.checkCollisions = true;
        
        var arrowSpriteManager = new BABYLON.SpriteManager('arrowSpriteManager', 'assets/images/arrow.png', 1, 256, this.scene);
        this.ammoBox.arrow = new BABYLON.Sprite('arrow', arrowSpriteManager);
        this.ammoBox.arrow.position.y = 5;
        this.ammoBox.arrow.size = 4;
    }

    updateStats() {
        this.lifeTextControl.text = 'Life: ' + this.playerLife;
        this.ammoTextControl.text = 'Ammo: ' + this.weapon.ammo;
        this.hitsTextControl.text = 'Hits: ' + this.player.hits;
    }

    gameOver() {
        GAME.pause();
        
        this.player.stopTimeCounter();
        this.player.calculatePoints();
        
        this.showMenu();
        this.exitPointerLock();
        this.enemies.forEach(enemy => enemy.remove());
        this.removeUnnecessaryEnemies();
        
        if(this.ammoBox) {
            this.ammoBox.dispose();
            this.ammoBox.arrow.dispose();
        }
    }

    showMenu() {
        this.pointsTextControl.text = 'Points: ' + this.player.getPoints();
        this.currentRecordTextControl.text = 'Current Record: ' + this.player.getLastRecord();
        this.menu.show();

        if(this.player.hasMadePointsRecord()) {
            this.hasMadeRecordTextControl.isVisible = true;
        } else {
            this.hasMadeRecordTextControl.isVisible = false;
        }
    }

    replay() {
        this.playerLife = 100;
        this.player.hits = 0;

        this.maxEnemies = 10;
        this.currentEnemies = 0;
        this.enemies = [];
        this.enemyDistanceFromCenter = 100;

        this.updateStats();
        GAME.resume();
        this.menu.hide();

        this.camera.position = new BABYLON.Vector3(0, 3.5, 100);
        this.weapon.reload();
        this.addEnemies();

        this.player.startTimeCounter();
    }
    
    beforeRender() {
        if(!GAME.isPaused()) {
            this.weapon.controlFireRate();
            this.enemies.forEach(enemy => enemy.move());

            if(this.camera.position.y < -20) {
                this.gameOver();
            }
        }
    }

}
