class Player extends Entity{


    static Right = new THREE.Vector3(-1, 0, 0);
    static Up = new THREE.Vector3(0, 1, 0);
    static Forward = new THREE.Vector3(0, 0, 1);

    static maxPixelDist = 10;
    static minAngleY = -Math.PI/2.0;
    static maxAngleY = Math.PI/2.0;

    constructor(objec3D){
        super(objec3D);
        this.addComponent(BoxCollider, 0.6, 1.8, 0.6);
    }

    Start(){
        this.walkSpeed = 4.317;
        this.sprintSpeed = 5.612;
        this.sneakSpeed = 1.295;
        this.flyingSpeed = 10.89;
        this.flyingSprintSpeed = 21.78;
        this.rotationSpeed = 1;
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();
        this.movement = new THREE.Vector3();
        this.tmpeuler = new THREE.Euler( 0, 0, 0, 'YXZ' );
        this.sensibility = 0.005;
        this.cameraPosition = new THREE.Vector3(0.3, 1.6, 0.3);
        this.zoom = 2;
        this.isRunning = false;
        this.isSneaking = false;
        this.zoomAnim = 0;
        this.sneakAnim = this.cameraPosition.y;
        this.isFlying = false;
        this.lastTimePressingSpace = 0;
        this.lastTimePressingZ = 0;
        this.collider = this.getComponent(BoxCollider);
        this.FunctionToggletime = 0.25;

        Input.onKeyUp = (key) => {
            if(key == ' '){
                if(app.time - this.lastTimePressingSpace < this.FunctionToggletime)
                    this.toggleFly();
                else    
                    this.lastTimePressingSpace = app.time;
            }
            if(key == 'z') {
                this.lastTimePressingZ = app.time;
            }
        };
        this.collider.onSideCollision = (x,y,z) => {this.isRunning = false;};
    }


    Update(deltaTime){
        this.RotateCamera();
        this.CalculateMovement()
        if(!this.isFlying)
             this.collider.applyForce(0, -28, 0);
        //let fall =  this.collider.velocity.y;
         this.collider.setLinearVelocityV(this.movement);
         this.collider.setOffset(this.cameraPosition);
        
        if(this.isRunning &&  this.zoomAnim > -0.3)
        this.zoomAnim = lerp(0.1, this.zoomAnim, -0.3);
        else if(this.zoomAnim < 0){
            this.zoomAnim = lerp(0.1, this.zoomAnim, 0);
        }
        this.transform.zoom = 1 + Input.getKey('x') * this.zoom + this.zoomAnim;
        this.transform.updateProjectionMatrix();
        this.transform.updateMatrix();
        if(this.collider.onGround){
            this.isFlying = false;
        }
    }

    RotateCamera(){
        let rotX = 0, rotY = 0, rotZ = 0, move = Input.getMouseMovement();
        if(move.changed) {
            rotX = this.rotationSpeed * move.x * this.sensibility;
            rotY = this.rotationSpeed * move.y * this.sensibility;
        }
        //console.log(this.transform);
        //this.transform.zoom = 1 + Input.getKey('x') * this.zoom;
        //this.transform.updateProjectionMatrix();
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
        if(rotX != 0 || rotY != 0 || rotZ != 0 ){
            this.tmpeuler.setFromQuaternion(this.transform.quaternion);
            this.tmpeuler.y -= rotX /* deltaTime*/;
            this.tmpeuler.x = clamp(this.tmpeuler.x - (rotY /* deltaTime*/), Player.minAngleY, Player.maxAngleY);
            this.tmpeuler.z -= rotZ /* deltaTime*/;
            this.transform.quaternion.setFromEuler(this.tmpeuler);
        }
    }

    toggleFly(){
        this.isFlying = !this.isFlying;
    }

    CalculateMovement(){
        this.up = Player.Up;
        this.transform.getWorldDirection(this.forward);
        this.forward.y = 0;
        this.forward.normalize();
        this.right.crossVectors(this.up, this.forward);
        this.right.normalize();
        this.movement.set(0, 0, 0);
        if(Input.getKey("Control")){
            this.isRunning = true
        }
        if(Input.getKey('z')) {
            if(app.time - this.lastTimePressingZ < this.FunctionToggletime){
                this.isRunning = true;
                this.lastTimePressingZ = 0;
            }
           this.movement.add(this.forward);
        }
        if(Input.getKey('s')) {
           this.movement.sub(this.forward);
           this.isRunning = false;
        }
        if(Input.getKey('q')) {
           this.movement.add(this.right);
        }
        if(Input.getKey('d')) {
           this.movement.sub(this.right);
        }
        if(this.movement.length() == 0)
            this.isRunning = false;

        if(Input.getKey("Shift")) {
            this.sneakAnim = lerp(0.1, this.sneakAnim, 1.4);
            this.isSneaking = true;
            this.isRunning = false;
        }else{
            this.sneakAnim = lerp(0.1, this.sneakAnim, 1.6);
            this.isSneaking = false;
        }
        this.cameraPosition.y = this.sneakAnim;
        let speed;
        
        if(this.isFlying){
            speed = (this.isRunning ? this.flyingSprintSpeed: this.flyingSpeed);
            if(this.isSneaking){
                this.movement.y -= 0.5;
            }
            if(Input.getKey(' ')){
                this.movement.y += 0.5;
            }
        }else{
            speed = (this.isSneaking ? this.sneakSpeed : (this.isRunning ? this.sprintSpeed : this.walkSpeed));
        }
        this.movement.normalize();
        this.movement.multiplyScalar(speed);
        if(!this.isFlying){
            if(Input.getKey(' ') &&  this.collider.onGround) {
                this.movement.y = 8;
            }else{
                this.movement.y =  this.collider.velocity.y;
            }
        }
       
    }
}