// ToDo: Constant variables;
const cameraProps = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
    position: {
        x: 0,
        y: 10,
        z: 22,
    }
}

const ambientLightProps = {
    color: 0xd1d1d1,
    intensity: 1,
}

const spotLightProps = {
    color: 0xffffff,
    intensity: 0.3,
    position: {
        x: 100,
        y: 1000,
        z: 100,
    },
    castShadow: true,
    shadow: {
        mapSize: {
            width: 1024,
            height: 1024,
        },
        camera: {
            near: 500,
            far: 4000,
            fov: 30,
        }
    }
}

const modelAnimationProps = {
    heightLimit: 0.5,
    speed: 0.02,
}

const modelProps = {
    position: {
        x: 0,
        y: 0,
        z: 0,
    },
    scale: {
        x: 0.1,
        y: 0.1,
        z: 0.1,
    },
    rotation: {
        x: 0,
        y: - Math.PI / 2,
        z: 0,
    }
}

const rotationPivot = { // center pos of rotation
    x: 0,
    y: 0,
    z: -14,
}

const initRotateAngle = 0;
const angleUnit = 40;

const modelsRotateSpeed = 4;

/*****************************/

class canvasControl {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( cameraProps.fov, cameraProps.aspect, cameraProps.near, cameraProps.far );
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.light = new THREE.AmbientLight( ambientLightProps.color, ambientLightProps.intensity );
        this.spotLight = new THREE.SpotLight( spotLightProps.color, spotLightProps.intensity );

        this.loader = new THREE.GLTFLoader();
        this.modelArray = [];   // array of model

        this.targetRotateAngle = 0; // target rotate angle
        this.currentRotateAngle = 0;    // current rotate angle
    }
    rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
        pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;
    
        if(pointIsWorld){
            obj.parent.localToWorld(obj.position); // compensate for world coordinate
        }
    
        obj.position.sub(point); // remove the offset
        obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
        obj.position.add(point); // re-add the offset
    
        if(pointIsWorld){
            obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
        }
    
        obj.rotateOnAxis(axis, theta); // rotate the OBJECT
    }
    updateModels() {
        const limit = modelAnimationProps.heightLimit;
        const dis = modelAnimationProps.speed;

        for( let i = 0; i < this.modelArray.length; i++ ) {
            if( Math.abs(this.modelArray[i].animation.currentY) >= limit )
                this.modelArray[i].animation.direction = -this.modelArray[i].animation.direction;
            
            this.modelArray[i].animation.currentY += this.modelArray[i].animation.direction * dis;
            this.modelArray[i].scene.position.y = this.modelArray[i].animation.currentY;
        }
    }
    init() {
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.camera.position.x = cameraProps.position.x;
        this.camera.position.y = cameraProps.position.y;
        this.camera.position.z = cameraProps.position.z;

        document.getElementById('app').appendChild( this.renderer.domElement );

        this.scene.add(this.light);

        this.spotLight.position.set( spotLightProps.position.x, spotLightProps.position.y, spotLightProps.position.z );

        this.spotLight.castShadow = spotLightProps.castShadow;

        this.spotLight.shadow.mapSize.width = spotLightProps.shadow.mapSize.width;
        this.spotLight.shadow.mapSize.height = spotLightProps.shadow.mapSize.height;

        this.spotLight.shadow.camera.near = spotLightProps.shadow.camera.near;
        this.spotLight.shadow.camera.far = spotLightProps.shadow.camera.far;
        this.spotLight.shadow.camera.fov = spotLightProps.shadow.camera.fov;

        this.scene.add( this.spotLight );

        const self = this;

        this.loader.load( 'assets/model/CapsuleMachine12_11.glb', function ( gltf ) {

            const model = gltf.scene;
            model.position.x = modelProps.position.x;
            model.position.y = modelProps.position.y;
            model.position.z = modelProps.position.z;
        
            model.scale.x = modelProps.scale.x;
            model.scale.y = modelProps.scale.y;
            model.scale.z = modelProps.scale.z;
        
            model.rotation.x = modelProps.rotation.x;
            model.rotation.y = modelProps.rotation.y;
            model.rotation.z = modelProps.rotation.z;

        //////////////////////////////////////////////////////
            // model.children[10].material.opacity = 1;
        
            for( let i = 0; i < (360 / angleUnit); i++ ) {
                const cloneModel = model.clone();
                self.rotateAboutPoint(cloneModel, new THREE.Vector3(rotationPivot.x, rotationPivot.y, rotationPivot.z), new THREE.Vector3(0, 1, 0), THREE.Math.degToRad(initRotateAngle + angleUnit * i));
                self.modelArray.push({
                    scene: cloneModel,
                    animation: {
                        direction: Math.ceil(Math.random() * 1000000) % 2 === 0 ? 1 : -1,
                        currentY: (Math.random() * 100000000) % modelAnimationProps.heightLimit * 2 - modelAnimationProps.heightLimit,
                    }
                });

                const newModel = self.modelArray.at(-1);
                newModel.scene.position.y = newModel.animation.currentY;

                self.scene.add( self.modelArray.at(-1).scene );
            }
        }, undefined, function ( error ) {
            console.error( error );
        } );
    }
}

const control = new canvasControl();
control.init();

const animate = () => {
    if( control.modelArray.length > 0 && control.currentRotateAngle != control.targetRotateAngle ) {
        const offset = control.currentRotateAngle > control.targetRotateAngle ? -modelsRotateSpeed : modelsRotateSpeed;

        for( let i = 0; i < control.modelArray.length; i++ ) {
            control.rotateAboutPoint(control.modelArray[i].scene, new THREE.Vector3(rotationPivot.x, rotationPivot.y, rotationPivot.z), new THREE.Vector3(0, 1, 0), THREE.Math.degToRad( offset ));
        }

        control.currentRotateAngle += offset;
    }

    if( control.modelArray.length )
        control.updateModels();

    requestAnimationFrame( animate );

    control.renderer.render( control.scene, control.camera );
}

animate();

window.rotateLeft = () => {
    control.targetRotateAngle += angleUnit;
}

window.rotateRight = () => {
    control.targetRotateAngle -= angleUnit;
}

var flag = 0;
window.ondblclick = () => {

    if(flag == 0){
       
        setTimeout( function() {
            gsap.to(control.camera, {
                duration: 2,
                zoom: 2,
                onUpdate: function () {
                    control.camera.updateProjectionMatrix();
                }
            } );
            gsap.to(control.camera.position, {y : 15})
        }, 300 );

        document.getElementById('rotateRight').style.display = "none";
        document.getElementById('rotateLeft').style.display = "none";

        flag = 1;
    }else {

        setTimeout( function() {
            gsap.to(control.camera, {
                duration: 2,
                zoom: 1,
                onUpdate: function () {
                    control.camera.updateProjectionMatrix();
                }
            } );
            gsap.to(control.camera.position, {y : 10})
        }, 300 );
        
        document.getElementById('rotateRight').style.display = "block";
        document.getElementById('rotateLeft').style.display = "block";

        flag = 0;
    }
}