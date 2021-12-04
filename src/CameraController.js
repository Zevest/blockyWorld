class CameraController extends Component{
    static Right = new THREE.Vector3(-1, 0, 0);
    static Up = new THREE.Vector3(0, 1, 0);
    static Forward = new THREE.Vector3(0, 0, 1);

    static maxPixelDist = 10;
    static minAngleY = -Math.PI/2.0;
    static maxAngleY = Math.PI/2.0;
    constructor(object3D) {
        super(object3D)
    }

    Start(){
        this.moveSpeed = 3;
        this.rotationSpeed = 1;
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();
        this.tmpeuler = new THREE.Euler( 0, 0, 0, 'YXZ' );
        this.parent.updateMatrix();
        this.lastPos = new THREE.Vector3();
        this.sensibility = 0.005;
        this.lastPos.copy(this.parent.position);
        this.zoom = 2;
    }
    
    setPosition(v, y, z) {
        switch(arguments.length) {
            case 1:
                this.parent.position.set(v.x, v.y, v.z);
                break;
            default:
            case 3:
                this.parent.position.set(v, y, z);
                break;
        }
    }



    setMoveSpeed(speed) { this.moveSpeed = speed }
    setRotationSpeed(speed) { this.rotationSpeed = speed }

    Update(deltaTime) {
        this.up = this.parent.up;
        this.parent.getWorldDirection(this.forward);
        this.right.crossVectors(this.up, this.forward);
        this.right.normalize();
        const mult = (Input.getKey("Shift") ? 3 : 1);
        if(Input.getKey('z')) {
            this.parent.position.addScaledVector(this.forward, mult * this.moveSpeed * deltaTime);
        }
        if(Input.getKey('s')) {
            this.parent.position.addScaledVector(this.forward,  mult * -this.moveSpeed * deltaTime);
        }
        if(Input.getKey('q')) {
            this.parent.position.addScaledVector(this.right,  mult * this.moveSpeed * deltaTime);
        }
        if(Input.getKey('d')) {
            this.parent.position.addScaledVector(this.right,  mult * -this.moveSpeed * deltaTime);
        }
        if(Input.getKey(' ')) {
            this.parent.position.addScaledVector(this.up,  mult * this.moveSpeed * deltaTime);
        }
        if(Input.getKey("Control")) {
            this.parent.position.addScaledVector(this.up,  mult * -this.moveSpeed * deltaTime);
        }
        let rotX = 0, rotY = 0, rotZ = 0, move = Input.getMouseMovement();
        if(move.changed) {
            rotX = this.rotationSpeed * move.x * this.sensibility;
            rotY = this.rotationSpeed * move.y * this.sensibility;
        }
        this.parent.zoom = 1 + Input.getKey('x') * this.zoom;
        this.parent.updateProjectionMatrix();
        if(Input.getKey("ArrowLeft")) {
            rotX -= this.rotationSpeed;
        }
        if(Input.getKey("ArrowRight")) {
            rotX += this.rotationSpeed;
        }
        if(Input.getKey("ArrowUp")) {
            rotY -= this.rotationSpeed;
        }
        if(Input.getKey("ArrowDown")) {
            rotY += this.rotationSpeed;
        }
        if(Input.getKey("a")) {
            rotZ -= this.rotationSpeed * this.sensibility;
        }
        if(Input.getKey("e")) {
            rotZ += this.rotationSpeed * this.sensibility;
        }
        if(rotX != 0 || rotY != 0 || rotZ != 0 || !this.parent.position.equals(this.lastPos)){
            this.tmpeuler.setFromQuaternion(this.parent.quaternion);
            this.tmpeuler.y -= rotX /* deltaTime*/;
            this.tmpeuler.x = clamp(this.tmpeuler.x - (rotY /* deltaTime*/), CameraController.minAngleY, CameraController.maxAngleY);
            this.tmpeuler.z -= rotZ /* deltaTime*/;
            this.parent.quaternion.setFromEuler(this.tmpeuler);
            this.parent.updateMatrix();
        }
        this.lastPos.copy(this.parent.position);
    }
}