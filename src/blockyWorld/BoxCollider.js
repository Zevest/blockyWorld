class BoxCollider extends Component {
    constructor(object3D, width, height, depth) {
        super(object3D, width, height, depth);
       
       // console.log(this.acceleration, this.velocity, this.position);
        if(!width || !height || ! depth){
            this.autoSize = true;
            this.width = this.object3D.scale.x;
            this.height = this.object3D.scale.y;
            this.depth = this.object3D.scale.z;
        }else{
            this.autoSize = false;
            this.width = width;
            this.height = height;
            this.depth = depth;
            
        }
        
        
        this.position = new THREE.Vector3(object3D.position.x, object3D.position.y, object3D.position.z);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        
        this.box = new THREE.Box3(this.position, new THREE.Vector3(this.width, this.height, this.depth));
        this.vizualizer = new THREE.Box3Helper(this.box, Color(255,0,255));
        this.friction = 0.99;
        this.onCollisionDown = null;
        this.onCollisionUp = null;
        this.onCollisionLeft = null;
        this.onCollisionRight = null;
        this.onCollisionFront = null;
        this.onCollisionBack = null;
        this.onCollision = null;
        this.onGround = false;
    }

    init(scene) {   
        scene.add(this.vizualizer);
    }

    applyForceV(force){
        this.acceleration.add(force);
    }

    applyForce(fx, fy, fz) {
        this.acceleration.x += fx;
        this.acceleration.y += fy;
        this.acceleration.z += fz;
    }

    setLinearVelocityV(velocity){
        this.velocity.copy(velocity);
    }

    setLinearVelocity(vx, vy, vz){
        this.velocity.set(vx, vy, vz);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }

    CollideX(){
        let collide = 0, y, z;
        for(y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height); ++y){
            for(z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth); ++z) {
                let b = World.currentWorld.getBlock(this.position.x, y, z);
                let b2 = World.currentWorld.getBlock(this.position.x+this.width, y, z);
                if(b >= 0 && !BlockData.CROSS_LIST[b]){
                    // Check Y Collision for 
                    collide = 1;
                    break;
                }else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2]){
                    collide = 2;
                    break;
                }
                
            }           
            
            switch(collide){
                // Move back if necessary
                case 1:{
                    let offset = this.position.x - Math.ceil(this.position.x);
                    this.position.x -=  offset;
                    //console.log("Collide while moving toward negative x", offset);
                    this.velocity.x = 0;
                    if(this.onCollisionLeft) this.onCollisionLeft(this.position.x, y, z);
                    break;
                    }
                case 2:{
                    let offset = (this.position.x + this.width) - Math.floor(this.position.x + this.width);
                    this.position.x -= offset;
                    //console.log("Collide while moving toward positive x", offset);
                    this.velocity.x = 0;
                    if(this.onCollisionRight) this.onCollisionRight(this.position.x+this.width, y, z);
                    break;
                    }   
            }
        }
        return collide;
    }

    CollideY(){
        this.onGround = false;
        let collide = 0, x, z;
        for(x = Math.floor(this.position.x); x < Math.ceil(this.position.x + this.width); ++x){
            for(z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth); ++z) {
                let b = World.currentWorld.getBlock(x,this.position.y, z);
                let b2 = World.currentWorld.getBlock(x,this.position.y+this.height, z);
                if(b >= 0 && !BlockData.CROSS_LIST[b]){
                    // Check Y Collision for 
                    collide = 1;
                    break;
                }else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2]){
                    collide = 2;
                    break;
                }
                
            }           
            
            switch(collide){
                // Move back if necessary
                case 1:{
                    let offset = this.position.y - Math.ceil(this.position.y);
                    this.position.y -=  offset;
                    //console.log("Collide while moving toward negative y", offset);
                    this.velocity.y = 0;
                    this.onGround = true;
                    if(this.onCollisionDown) this.onCollisionDown(x,this.position.y, z);
                    break;
                    }
                case 2:{
                    let offset = (this.position.y + this.height) - Math.floor(this.position.y + this.height);
                    this.position.y -= offset;
                    //console.log("Collide while moving toward positive y", offset);
                    this.velocity.y = 0;
                    if(this.onCollisionUp) this.onCollisionUp(x,this.position.y+this.height, z);
                    break;
                    }   
            }
        }
        return collide;
    }

    CollideZ(){
        let collide = 0, y, x;
        for(y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height); ++y){
            for(x = Math.floor(this.position.x); x < Math.ceil(this.position.x + this.width); ++x) {
                let b = World.currentWorld.getBlock(x, y, this.position.z);
                let b2 = World.currentWorld.getBlock(x, y, this.position.z + this.depth);
                if(b >= 0 && !BlockData.CROSS_LIST[b]){
                    // Check Y Collision for 
                    collide = 1;
                    break;
                }else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2]){
                    collide = 2;
                    break;
                }
                
            }           
            
            switch(collide){
                // Move back if necessary
                case 1:{
                    let offset = this.position.z - Math.ceil(this.position.z);
                    this.position.z -=  offset;
                    //console.log("Collide while moving toward negative z", offset);
                    this.velocity.z = 0;
                    if(this.onCollisionBack) this.onCollisionBack(x, y, this.position.z);
                    break;
                    }
                case 2:{
                    let offset = (this.position.z + this.depth) - Math.floor(this.position.z + this.depth);
                    this.position.z -= offset;
                    //console.log("Collide while moving toward positive z", offset);
                    this.velocity.z = 0;
                    if(this.onCollisionFront) this.onCollisionFront(x, y, this.position.z + this.depth);
                    break;
                }   
            }
        }
        return collide;
    }


    Update(deltaTime) {
        if(this.autoSize){
            this.width = this.object3D.scale.x;
            this.height = this.object3D.scale.y;
            this.depth = this.object3D.scale.z;
        }

        this.velocity.addScaledVector(this.acceleration, deltaTime);
        this.acceleration.set(0, 0, 0);
        let collide = 0;
        if(this.velocity.y != 0){
            this.position.y += this.velocity.y * deltaTime;
            collide += this.CollideY();
            
        }
        if(this.velocity.x != 0){
            this.position.x += this.velocity.x * deltaTime;
            collide += this.CollideX();
            this.velocity.x *= this.friction;
        }
        if(this.velocity.z != 0){
            this.position.z += this.velocity.z * deltaTime;
            collide += this.CollideZ();
            this.velocity.z *= this.friction;
        }
        if(collide && this.onCollision) this.onCollision();
        /* this.position.y += this.velocity.y * deltaTime;
        let collide = 0;
        for(let x = Math.floor(this.position.x); x < Math.ceil(this.position.x + this.width); ++x){
            for(let z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth); ++z) {
                let b = World.currentWorld.getBlock(x,this.position.y, z);
                let b2 = World.currentWorld.getBlock(x,this.position.y+this.height, z);
                if(b >= 0 && !BlockData.CROSS_LIST[b]){
                    // Check Y Collision for 
                    collide = 1;
                    break;
                }else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2]){
                    collide = 2;
                    break;
                }
                
            }           
            let offset;
            switch(collide){
                // Move back if necessary
                case 1:{
                    offset = this.position.y - Math.ceil(this.position.y);
                    this.position.y -=  offset;
                    console.log("Collide down", offset);
                    this.velocity.y = 0;
                    break;
                    }
                case 2:{
                    offset = (this.position.y + this.height) - Math.floor(this.position.y + this.height);
                    this.position.y -= offset;//Math.floor(this.position.y + this.height);
                    console.log("Collide up", offset);
                    this.velocity.y = 0;
                    break;
                    }   
            }
        }*/
        
        //let collide = false;
        //this.position.x += this.velocity.x * deltaTime;
        /*
        for(let y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height); ++y){
            for(let z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth); ++z) {
                let b = World.currentWorld.getBlock(this.position.x, y, z);
                if(b > 0 && !BlockData.CROSS_LIST[b]){
                    collide = true;
                    break;
                }
            }
            if(collide){
                this.position.x = Math.floor(this.position.y);
                break;
            }
        }*/
        // Check X Collision for 
        // Move back if necessary
        //this.position.z += this.velocity.z * deltaTime;
        // Check Z Collision for 
        // Move back if necessary
        
        
        this.box.min.copy(this.position);
        this.box.max.set(this.width + this.box.min.x, this.height +  this.box.min.y, this.depth +  this.box.min.z);
        
    }

    
}
