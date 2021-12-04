class BoxCollider extends Component {
    constructor(object3D, width, height, depth) {
        super(object3D, width, height, depth);
        console.log(object3D);
       // console.log(this.acceleration, this.velocity, this.position);
        if(!width || !height || ! depth){
            this.autoSize = true;
            this.width = this.parent.scale.x;
            this.height = this.parent.scale.y;
            this.depth = this.parent.scale.z;
        }else{
            this.autoSize = false;
            this.width = width;
            this.height = height;
            this.depth = depth;
        }
        this.onDownCollision = null;
        this.onUpCollision = null;
        this.onLeftCollision = null;
        this.onRightCollision = null;
        this.onFrontCollision = null;
        this.onBackCollision = null;
        this.onSideCollision = null;
        this.onCollision = null;
    }
    Start() {
        this.position = new THREE.Vector3(this.parent.position.x, this.parent.position.y, this.parent.position.z);
        this.posOffset = new THREE.Vector3(0.5, 0.5, 0.5);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        
        this.box = new THREE.Box3(this.position, new THREE.Vector3(this.width, this.height, this.depth));

        this.friction = 0.8;
        this.airFriction = 0.999;


        this.onGround = false;
        this.simulationStep = 3;
        console.log("Start");
    }

    setOffset(offset){
        this.posOffset.copy(offset);
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
        for(y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height) && !collide; ++y){
            for(z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth)  && !collide; ++z) {
                let b = World.currentWorld.getBlock(this.position.x, y, z);
                let b2 = World.currentWorld.getBlock(this.position.x+this.width, y, z);
                if( b == -2)
                    collide = -2;
                else if(b2 == -2)
                    collide = -3;
                else if(b >= 0 && !BlockData.CROSS_LIST[b])
                    collide = 1; 
                else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2])
                    collide = 2;
                
            }
        }
        switch(collide){
            // Move back if necessary
            case 1:
                if(this.onLeftCollision) this.onLeftCollision(this.position.x, y, z);
                if(this.onSideCollision) this.onSideCollision(this.position.x, y, z);
                
            case -2:
                {
                let offset = this.position.x - Math.ceil(this.position.x);
                this.position.x -=  offset;
                //console.log("Collide while moving toward negative x", offset);
                this.velocity.x = 0;
                break;
                }
            case 2:
                if(this.onRightCollision) this.onRightCollision(this.position.x+this.width, y, z);
                if(this.onSideCollision) this.onSideCollision(this.position.x+this.width, y, z);
            case -3:{
                let offset = (this.position.x + this.width) - Math.floor(this.position.x + this.width);
                this.position.x -= offset;
                //console.log("Collide while moving toward positive x", offset);
                this.velocity.x = 0;
                break;
                }   
        }
        return collide;
    }

    CollideY(){
        this.onGround = false;
        let collide = 0, x, z;
        let pos = World.ToLocalCoord(this.position.x, this.position.y, this.position.z);
        if((World.currentWorld.chunks[World.chunkID(pos.chunkX, pos.chunkZ)])) {
            for(x = Math.floor(this.position.x); x < Math.ceil(this.position.x + this.width) && !collide; ++x){
                for(z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth) && !collide; ++z) {
                    let b = World.currentWorld.getBlock(x,this.position.y, z);
                    let b2 = World.currentWorld.getBlock(x,this.position.y+this.height, z);
                    /*if( b == -2)
                        collide = -2;
                    else if(b2 == -2) // Prevents Geting out of the world
                        collide = -3;
                    else */if(b >= 0 && !BlockData.CROSS_LIST[b])
                        collide = 1; 
                    else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2])
                        collide = 2;
                    
                }           

            }
        }
        else collide = -2;
        switch(collide){
            // Move back if necessary
            case 1:
                if(this.onDownCollision) this.onDownCollision(x,this.position.y, z);
                this.onGround = true;
            case -2:{
                let offset = this.position.y - Math.ceil(this.position.y);
                this.position.y -=  offset;
                //console.log("Collide while moving toward negative y", offset);
                this.velocity.y = 0;
                break;
                }
            case 2:
                if(this.onUpCollision) this.onUpCollision(x,this.position.y+this.height, z);
            case -3:{
                let offset = (this.position.y + this.height) - Math.floor(this.position.y + this.height);
                this.position.y -= offset;
                //console.log("Collide while moving toward positive y", offset, this.position.y, Math.floor(this.position.y + this.height));
                this.velocity.y = 0;
                break;
                }   
        }
        return collide;
    }

    CollideZ(){
        let collide = 0, y, x;
        for(y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height)  && !collide; ++y){
            for(x = Math.floor(this.position.x); x < Math.ceil(this.position.x + this.width)  && !collide; ++x) {
                let b = World.currentWorld.getBlock(x, y, this.position.z);
                let b2 = World.currentWorld.getBlock(x, y, this.position.z + this.depth);
                // Check Z Collision for 
                if( b == -2)
                    collide = -2;
                else if(b2 == -2)
                    collide = -3;
                else if(b >= 0 && !BlockData.CROSS_LIST[b])
                    collide = 1; 
                else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2])
                    collide = 2;
            }           
        }
        switch(collide){
            // Move back if necessary
            case 1:
                if(this.onBackCollision) this.onBackCollision(x, y, this.position.z);
                if(this.onSideCollision) this.onSideCollision(x, y, this.position.z);
            case -2:{
                let offset = this.position.z - Math.ceil(this.position.z);
                this.position.z -=  offset;
                //console.log("Collide while moving toward negative z", offset);
                this.velocity.z = 0;
                break;
                }
            case 2:
                if(this.onFrontCollision) this.onFrontCollision(x, y, this.position.z + this.depth);
                if(this.onSideCollision) this.onSideCollision(x, y, this.position.z + this.depth);
            case -3:{
                let offset = (this.position.z + this.depth) - Math.floor(this.position.z + this.depth);
                this.position.z -= offset;
                //console.log("Collide while moving toward positive z", offset);
                this.velocity.z = 0;
                break;
            }   
        }
        return collide;
    }


    Update(deltaTime) {
        if(this.autoSize){
            this.width = this.parent.scale.x;
            this.height = this.parent.scale.y;
            this.depth = this.parent.scale.z;
        }

        this.velocity.addScaledVector(this.acceleration, deltaTime);
        this.acceleration.set(0, 0, 0);

        let MaxSpeed = (1/ deltaTime) * Math.min(this.width, this.height, this.depth) * this.simulationStep - 10;
        if(this.velocity.length() > MaxSpeed){
            this.velocity.normalize();
            this.velocity.multiplyScalar(MaxSpeed);
        }
        
        let collide = 0;
        for(let i = 0, collide = 0; i < this.simulationStep&& !collide; ++i){
            if(this.velocity.y != 0){
                this.position.y += (this.velocity.y/this.simulationStep) * deltaTime;
                collide += this.CollideY();
            }
        }
        for(let i = 0, col = 0; i < this.simulationStep&& !col; ++i){
            if(this.velocity.x != 0){
                this.position.x += (this.velocity.x/this.simulationStep) * deltaTime;
                collide += this.CollideX();
                
            }
            if(this.velocity.z != 0){
                this.position.z += (this.velocity.z/this.simulationStep) * deltaTime;
                collide += this.CollideZ();
                
            }
        }
        if(this.onGround){
            //this.velocity.x *= this.friction;
            //this.velocity.z *= this.friction;
        }else{
            this.velocity.x *= this.airFriction;
            this.velocity.z *= this.airFriction;
        }
        if(collide && this.onCollision) this.onCollision();
        
        this.box.min.set(this.position.x, this.position.y, this.position.z);
        this.box.max.set(this.width + this.box.min.x, this.position.y + this.height, this.depth +  this.box.min.z);
        this.parent.position.set(this.position.x + this.posOffset.x, this.position.y + this.posOffset.y, this.position.z + this.posOffset.z);
    }

    
}
