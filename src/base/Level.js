import AssetsDatabase from './AssetsDatabase';

export default class Level {

    constructor() {
        
        this.materials = {};
        this.scene = null;
        this.assets = null;

    }

    start() {
        
        if(this.setProperties) {
            this.setProperties();
        } else {
            GAME.log.debugWarning('The setProperties method is recommended to initialize the Level properties');
        }

        this.createScene();
    }

    createScene() {
        this.scene = new BABYLON.Scene(GAME.engine);

        this.assets = new AssetsDatabase(this.scene, () => {

            GAME.log.debug('Level Assets loaded');

            if(this.buildScene) {
                this.buildScene();
            } else {
                GAME.log.debugWarning('You can add the buildScene method to your level to define your scene');
            }

            if(this.beforeRender) {
                this.scene.registerBeforeRender(
                    this.beforeRender.bind(this)
                );
            } else {
                GAME.log.debugWarning('You can define animations and other game logics that happens inside the main loop on the beforeRender method');
            }

            GAME.resume();
            GAME.startRenderLoop();

        });

        if(this.setupAssets) {
            this.setupAssets();
        }

        this.assets.load();

        return this.scene;
    }

    exit() {
        GAME.canvas.blur();

        GAME.stopRenderLoop();

        if(this.onExit) {
            this.onExit();
        }

        this.scene.dispose();
        this.scene = null;
    }

    addCollider(name, options) {
        
        let collider = BABYLON.MeshBuilder.CreateBox(name, {
            width: options.width || 1, 
            height: options.height || 1, 
            depth: options.depth || 1
        }, this.scene);

        BABYLON.Tags.AddTagsTo(collider, 'collider boxCollider');

        collider.position.x = options.positionX || 0;
        collider.position.y = options.positionY || 0;
        collider.position.z = options.positionZ || 0;

        collider.isVisible = (options.visible) ? options.visible : false;

        if(collider.isVisible) {
            let colliderMaterial = new BABYLON.StandardMaterial(name + 'Material');
            colliderMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0);
            colliderMaterial.alpha = 0.5;

            collider.material = colliderMaterial;
        }

        options.timeToDispose = (options.timeToDispose) ? options.timeToDispose : 0;

        collider.actionManager = new BABYLON.ActionManager(this.scene);
        collider.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: options.collisionMesh
                },
                () => { 

                    if(options.onCollide) {
                        options.onCollide();
                    }
                    
                    if(options.disposeAfterCollision) {
                        setTimeout(() => {
                            collider.dispose();
                        }, options.timeToDispose);
                    }
                }
            )
        );

        return collider;

    }

    disposeColliders() {
        let colliders = this.scene.getMeshesByTags('collider');

        for(var index = 0; index < colliders.length; index++) {
            colliders[index].dispose();
        }
    }

    addMaterial(material) {
        this.materials[material.name] = material;
    }

    getMaterial(materialName) {
        return this.materials[materialName];
    }

    removeMaterial(materialName) {
        let material = null;
        if(material = this.materials[materialName]) {
            material.dispose();
            delete this.materials[materialName];
        }
    }

    interpolate(target, property, toValue, duration, afterExecutionCallback = null) {

        if(!this.scene.actionManager) {
            this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        }

        let interpolateAction = new BABYLON.InterpolateValueAction(
            BABYLON.ActionManager.NothingTrigger,
            target,
            property,
            toValue,
            duration
        );

        interpolateAction.onInterpolationDoneObservable.add(() => {
            GAME.log.debug('Interpolation done');
            if(afterExecutionCallback) afterExecutionCallback();
        });

        this.scene.actionManager.registerAction(interpolateAction);
        interpolateAction.execute();
        
    }

    enablePointerLock() {
        let canvas = GAME.canvas;
        
        if(!this.camera) {
            console.error('You need to add a camera to the level to enable pointer lock');
        }

        if (GAME.isMobile()) {
            return;
        }

        canvas.addEventListener("click", function(evt) {
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            if (canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        }, false);

        var pointerlockchange = (event) => {
            this.controlEnabled = (
                            document.mozPointerLockElement === canvas
                            || document.webkitPointerLockElement === canvas
                            || document.msPointerLockElement === canvas
                            || document.pointerLockElement === canvas);
            if (!this.controlEnabled) {
                this.camera.detachControl(canvas);
            } else {
                this.camera.attachControl(canvas);
            }
        };

        document.addEventListener("pointerlockchange", pointerlockchange, false);
        document.addEventListener("mspointerlockchange", pointerlockchange, false);
        document.addEventListener("mozpointerlockchange", pointerlockchange, false);
        document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    }

    exitPointerLock() {
        this.camera.detachControl(GAME.canvas);
    }

}