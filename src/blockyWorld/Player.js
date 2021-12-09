class Player extends Entity{


    static Right = new THREE.Vector3(-1, 0, 0);
    static Up = new THREE.Vector3(0, 1, 0);
    static Forward = new THREE.Vector3(0, 0, 1);

    static maxPixelDist = 10;
    static minAngleY = -Math.PI/2.0 + 0.001;
    static maxAngleY = Math.PI/2.0 - 0.001;

    constructor(objec3D) {
        super(objec3D);
        this.addComponent(BoxCollider, 0.6, 1.8, 0.6);
    }
     // TODO: fixe collision in x -63 z -63
    Start() {
        // Vitesse de deplacement
        this.walkSpeed = 4.317;
        this.sprintSpeed = 5.612;
        this.sneakSpeed = 1.295;
        this.flyingSpeed = 6.924//10.89;
        this.flyingSprintSpeed = 10.89//21.78;
        this.rotationSpeed = 1;
        this.jumpHeight = 8.5;
        this.jumpStrength = 1.0;

        // Direction
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();
        // Variable temporaire
        this.movement = new THREE.Vector3();
        this.tmpeuler = new THREE.Euler( 0, 0, 0, 'YXZ' );

        // Camera
        this.cameraPosition = new THREE.Vector3(0.3, 1.6, 0.3);
        this.zoom = 2;

        //Variable animation
        this.zoomAnim = 0;
        this.sneakAnim = this.cameraPosition.y;
        this.time = 0;
      
        this.sensitivity = 0.02;
        this.mouseSensitivity = 0.005;
        
        // Etat du joueur
        this.isRunning = false;
        this.isSneaking = false;
        this.isFlying = false;
        
        // Donnees des entrees du joueur
        this.spacePressed = false;
        this.ZPressed = false;
        this.lastTimePressingSpace = 0;
        this.lastTimePressingZ = 0;
        this.FunctionToggletime = 0.25;

        // Components
        this.collider = this.getComponent(BoxCollider);

        //TODO: separate movement into its own component
        // Initialisation des Callbacks
        Input.onKeyDown = (key) => {
            if(key == ' ' && !this.spacePressed) {
                if(this.time - this.lastTimePressingSpace < this.FunctionToggletime)
                    this.toggleFly();
                else this.lastTimePressingSpace = this.time;
                this.spacePressed = true;
            }
            if(key == 'z' && !this.ZPressed) {
                if(this.time - this.lastTimePressingZ < this.FunctionToggletime) {
                    this.isRunning = true;
                    this.lastTimePressingZ = 0;
                }
                else this.lastTimePressingZ = this.time;
                this.ZPressed = true;
            }
        };
        Input.onKeyUp = (key) =>{
            if(key == ' ') {
                this.spacePressed = false;
            }
            if(key == 'z') {
                this.ZPressed = false;
            }
        }
        this.collider.onSideCollision = (x,y,z) => {this.isRunning = false;};
    }


    Update(deltaTime) {
        this.time += deltaTime;
        this.RotateCamera();
        this.CalculateMovement();

        // La gravite n'affecte pas le joueur lorsqu'il vole
        if(!this.isFlying)
             this.collider.applyForce(0, -28, 0);
       
        this.collider.setLinearVelocityV(this.movement);
        this.collider.setOffset(this.cameraPosition);
        // Recalcule les animations
        this.calculateAnimation(deltaTime * 10);
        this.cameraPosition.y = this.sneakAnim;
        // Zoom
        this.transform.zoom = 1 + Input.getKey('c') * this.zoom + this.zoomAnim;
        this.transform.updateProjectionMatrix();
        this.transform.updateMatrix();

        if(this.collider.onGround) {
            this.isFlying = false;
        }
    }

    /// Calcule l'etat de la position et du zoom de la camera
    calculateAnimation(deltaTime) {
        if(this.isRunning &&  this.zoomAnim > -0.3)
        this.zoomAnim = lerp(deltaTime, this.zoomAnim, -0.3);
        else if(this.zoomAnim < 0)
            this.zoomAnim = lerp(deltaTime, this.zoomAnim, 0);
        
        if(Input.getKey("Shift"))
            this.sneakAnim = lerp(deltaTime, this.sneakAnim, 1.4);
        else
            this.sneakAnim = lerp(deltaTime, this.sneakAnim, 1.6);
    }

    /// Fait tourner la camera en fonction des entree utilisateur
    RotateCamera() {
        let rotX = 0, rotY = 0, rotZ = 0, move = Input.getMouseMovement();
        if(move.changed) {
            rotX = this.rotationSpeed * move.x * this.mouseSensitivity;
            rotY = this.rotationSpeed * move.y * this.mouseSensitivity;
        }

        if(Input.getKey("ArrowLeft")) {
            rotX -= this.rotationSpeed * this.sensitivity;
        }
        if(Input.getKey("ArrowRight")) {
            rotX += this.rotationSpeed * this.sensitivity;
        }
        if(Input.getKey("ArrowUp")) {
            rotY -= this.rotationSpeed * this.sensitivity;
        }
        if(Input.getKey("ArrowDown")) {
            rotY += this.rotationSpeed * this.sensitivity;
        }
        if(Input.getKey("a")) {
            rotZ -= this.rotationSpeed * this.sensitivity;
        }
        if(Input.getKey("e")) {
            rotZ += this.rotationSpeed * this.sensitivity;
        }
        if(rotX != 0 || rotY != 0 || rotZ != 0 ) {
            this.tmpeuler.setFromQuaternion(this.transform.quaternion);
            this.tmpeuler.y -= rotX ;
            this.tmpeuler.x = clamp(this.tmpeuler.x - (rotY), Player.minAngleY, Player.maxAngleY);
            this.tmpeuler.z -= rotZ;
            this.transform.quaternion.setFromEuler(this.tmpeuler);
        }
    }

    /// Fait basculer l'etat en vole
    toggleFly() {
        this.isFlying = !this.isFlying;
    }

    /// Calcule les movements du joueur
    CalculateMovement() {
        this.up = Player.Up;
        // Recupere un vecteur pointant vers l'avant du joueur
        this.transform.getWorldDirection(this.forward);
        this.forward.y = 0;
        this.forward.normalize();
        // Calcule un vecteur pointant vers la droite du joueur
        this.right.crossVectors(this.up, this.forward);
        this.right.normalize();
        this.movement.set(0, 0, 0);

        // Entrer clavier de l'utilisateur
        if(Input.getKey("Control")) {
            this.isRunning = true
        }
        if(Input.getKey('z')) {  
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
        let isMoving = this.movement.length() != 0;
        if(!isMoving) this.isRunning = false;
        if(Input.getKey("Shift")) {
            this.isSneaking = true;
            if(!this.isFlying) this.isRunning = false;
        }else{
            this.isSneaking = false;
        }


        let speed;
        // Choix de la vitesse en fonction de l'etat du joueur
        if(this.isFlying) {
            speed = (this.isRunning ? this.flyingSprintSpeed: this.flyingSpeed);
        }else{
            speed = (this.isSneaking ? this.sneakSpeed : (this.isRunning ? this.sprintSpeed : this.walkSpeed));
        }
        
        if(isMoving) {
            this.movement.normalize();
            this.movement.multiplyScalar(speed);
        }else{
            // Conserve le mouvement
            this.movement.x = this.collider.velocity.x;
            this.movement.z = this.collider.velocity.z;
        }
        if(!this.isFlying) {
            // Controle au sol
            if(Input.getKey(' ') && this.collider.onGround) {
                if(this.collider.velocity.y == 0)
                    this.movement.y = this.jumpHeight * this.jumpStrength;
            }else{
                this.movement.y =  this.collider.velocity.y;
            }
        }else{
            // Controle en vole
            if(this.isSneaking) {
                this.movement.y = -speed;
            }
            if(Input.getKey(' ')) {
                this.movement.y = speed;
            }
        }
       
    }
}