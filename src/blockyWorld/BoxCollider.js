/// Gere les collisions d'une entite avec AABB
class BoxCollider extends Component {
    constructor(object3D, width, height, depth) {
        super(object3D, width, height, depth);
        // Si aucune taille n'est precise on recupere la taille de l'entite
        if(!width || !height || ! depth) {
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
        // Fonctions callback pour les collisions
        this.onDownCollision = null;
        this.onUpCollision = null;
        this.onLeftCollision = null;
        this.onRightCollision = null;
        this.onFrontCollision = null;
        this.onBackCollision = null;
        this.onSideCollision = null;
        this.onCollision = null;

        // Boite de collision
        this.min = new THREE.Vector3();
        this.max = new THREE.Vector3();
        
        // Position decalage par rapport a la boite de collision
        this.posOffset = new THREE.Vector3();
        
        // Simulation de la physique
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.friction = 0.9;
        this.airFriction = 0.98;

        // Nombre d'iteration du calcule de deplacement et de collision
        this.simulationStep = 3;

        this.onGround = false;
    }

    /// initialisation du composant
    Start() {
        this.position.set(this.parent.position.x, this.parent.position.y, this.parent.position.z);
        this.posOffset.set(0.5, 0.5, 0.5);
        this.min.set(this.position)
        this.max.set(this.width, this.height, this.depth);
    }

    /// Definie le decalage de la position de l'entite par rapport a la boite de collision
    setOffset(offset) {
        this.posOffset.copy(offset);
    }

    /// Applique une force sur la boite de collision
    applyForceV(force) {
        this.acceleration.add(force);
    }

    /// Applique une force sur la boite de collision
    applyForce(fx, fy, fz) {
        this.acceleration.x += fx;
        this.acceleration.y += fy;
        this.acceleration.z += fz;
    }

    /// Definie la velocite de la boite de collision
    setLinearVelocityV(velocity) {
        this.velocity.copy(velocity);
    }

    /// Definie la velocite de la boite de collision
    setLinearVelocity(vx, vy, vz) {
        this.velocity.set(vx, vy, vz);
    }

    /// Definie la position de la boite de collision
    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }

    /// Teste la collision sur l'axe X et replace la boite de collision si besoin
    CollideX() {
        let collide = 0, y, z;
        // Pour chaque sommet et chaque unite on effectue le test
        // Par exemple avec avec boite de collision ayant les dimension ci-dessous
        //    {width: 2.5, height: 3, depth: 0.7}
        // on effectue le test pour:
        // -  tous les x appartenant a {0, 2.5} (0 et width)
        // -  tous les y appartenant a {0, 1, 2, 3}
        // -  tous les z appartenant a {0, 0.7}
        for(y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height) && !collide; ++y) {
            for(z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth)  && !collide; ++z) {
                let b = World.currentWorld.getBlock(this.position.x, y, z);
                let b2 = World.currentWorld.getBlock(this.position.x+this.width, y, z);
                if( b == -2) // Le block n'existe pas (le chunk n'est peut etre pas encoire generer)
                    collide = -2;
                else if(b2 == -2) // Le block n'existe pas (le chunk n'est peut etre pas encoire generer)
                    collide = -3;
                else if(b >= 0 && !BlockData.CROSS_LIST[b]) // Un bloc solide existe a gauche
                    collide = 1; 
                else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2]) // Un bloc solide existe a droite
                    collide = 2;
                
            }
        }
        // Deplace la boite de collision hors du bloc s'il y a intersection
        switch(collide) {

            // Si le bloc a gauche existe on les callbacks
            case 1:
                if(this.onLeftCollision) this.onLeftCollision(this.position.x, y, z);
                if(this.onSideCollision) this.onSideCollision(this.position.x, y, z);
            // Dans le cas ou le chunk n'est pas charger, on empeche la boite de se deplacer dans cette direction
            case -2:
                {
                // On calcule la distance a deplace
                let offset = this.position.x - Math.ceil(this.position.x);
                this.position.x -=  offset;
                //console.log("Collide while moving toward negative x", offset);
                // On annule la vitesse sur cet axe
                this.velocity.x = 0;
                break;
                }
            // si le bloc a droite existe on les callbacks
            case 2:
                if(this.onRightCollision) this.onRightCollision(this.position.x+this.width, y, z);
                if(this.onSideCollision) this.onSideCollision(this.position.x+this.width, y, z);
            case -3:{
                // On calcule la distance a deplace
                let offset = (this.position.x + this.width) - Math.floor(this.position.x + this.width);
                this.position.x -= offset;
                //console.log("Collide while moving toward positive x", offset);
                // On annule la vitesse sur cet axe
                this.velocity.x = 0;
                break;
                }   
        }
        return collide;
    }

    /// Teste la collision sur l'axe Y et replace la boite de collision si besoin (Voir CollideX pour plus de detail)
    CollideY() {
        this.onGround = false;
        let collide = 0, x, z;
        let pos = World.ToLocalCoord(this.position.x, this.position.y, this.position.z);
        // Pour chaque sommet et chaque unite on effectue le test
        // Par exemple avec avec boite de collision ayant les dimension ci-dessous
        //    {width: 2.5, height: 3, depth: 0.7}
        // on effectue le test pour:
        // -  tous les x appartenant a {0, 1, 2, 2.5}
        // -  tous les y appartenant a {0, 3} (0 et height)
        // -  tous les z appartenant a {0, 0.7}
        if((World.currentWorld.chunks[World.chunkID(pos.chunkX, pos.chunkZ)])) {
            for(x = Math.floor(this.position.x); x < Math.ceil(this.position.x + this.width) && !collide; ++x) {
                for(z = Math.floor(this.position.z); z < Math.ceil(this.position.z + this.depth) && !collide; ++z) {
                    let b = World.currentWorld.getBlock(x,this.position.y, z);
                    let b2 = World.currentWorld.getBlock(x,this.position.y+this.height, z);
                    // Dans le jeux original le joueur peux se deplacer hors des limite des chunks
                    // cette partie n'est donc utiliser
                    /*
                    if( b == -2)
                        collide = -2;
                    else if(b2 == -2)
                        collide = -3;
                    else */
                    if(b >= 0 && !BlockData.CROSS_LIST[b])
                        collide = 1; 
                    else if(b2 >= 0 &&  !BlockData.CROSS_LIST[b2])
                        collide = 2;
                    
                }           

            }
        }
        else collide = -2; // Si le chunk n'est pas encore genere la boite de collision ne peut pas se déplacer ver le bas

        // Deplace la boite de collision hors du bloc s'il y a intersection
        switch(collide) {
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

    /// Teste la collision sur l'axe Z et replace la boite de collision si besoin (Voir CollideX pour plus de detail)
    CollideZ() {
        let collide = 0, y, x;
        // Pour chaque sommet et chaque unite on effectue le test
        // Par exemple avec avec boite de collision ayant les dimension ci-dessous
        //    {width: 2.5, height: 3, depth: 0.7}
        // on effectue le test pour:
        // -  tous les x appartenant a {0, 1, 2, 2.5}
        // -  tous les y appartenant a {0, 1, 2, 3}
        // -  tous les z appartenant a {0, 0.7} (0 et depth)
        for(y = Math.floor(this.position.y); y < Math.ceil(this.position.y + this.height)  && !collide; ++y) {
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
        switch(collide) {
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

    /// Deplace et fait les testes de collision sur les trois axes dans l'ordre Y, X puis Z
    MoveAndCollideYXZ(deltaTime) {
        let collide = 0;
        
        // Applique une portion de la vitesse sur l'axe Y et test la collision, le tous N fois
        // avec N est le nombre de pas de simulation ou moins si une collision a lieu
        for(let i = 0, collide = 0; i < this.simulationStep&& !collide; ++i) {
            if(this.velocity.y != 0) {
                this.position.y += (this.velocity.y/this.simulationStep) * deltaTime;
                collide += this.CollideY();
            }
        }
        // Applique une portion de la vitesse sur l'axe X et test la collision, le tous N fois
        // avec N est le nombre de pas de simulation ou moins si une collision a lieu
        for(let i = 0, col = 0; i < this.simulationStep&& !col; ++i) {
            if(this.velocity.x != 0) {
                this.position.x += (this.velocity.x/this.simulationStep) * deltaTime;
                col += this.CollideX();
                collide += col;
            }
        }
        // Applique une portion de la vitesse sur l'axe Z et test la collision, le tous N fois
        // avec N est le nombre de pas de simulation ou moins si une collision a lieu
        for(let i = 0, col = 0; i < this.simulationStep&& !col; ++i) {
            if(this.velocity.z != 0) {
                this.position.z += (this.velocity.z/this.simulationStep) * deltaTime;
                col += this.CollideZ();
                collide  += col;
                
            }
        }
        return collide;
    }

    /// Deplace et fait les testes de collision sur les trois axes dans l'ordre Y, Z puis X
    MoveAndCollideYZX(deltaTime) {
        let collide = 0;
        // Applique une portion de la vitesse sur l'axe Y et test la collision, le tous N fois
        // avec N est le nombre de pas de simulation ou moins si une collision a lieu
        for(let i = 0, collide = 0; i < this.simulationStep&& !collide; ++i) {
            if(this.velocity.y != 0) {
                this.position.y += (this.velocity.y/this.simulationStep) * deltaTime;
                collide += this.CollideY();
            }
        }
        // Applique une portion de la vitesse sur l'axe Z et test la collision, le tous N fois
        // avec N est le nombre de pas de simulation ou moins si une collision a lieu
        for(let i = 0, col = 0; i < this.simulationStep&& !col; ++i) {
            if(this.velocity.z != 0) {
                this.position.z += (this.velocity.z/this.simulationStep) * deltaTime;
                col += this.CollideZ();
                collide  += col;
                
            }
        }
        // Applique une portion de la vitesse sur l'axe X et test la collision, le tous N fois
        // avec N est le nombre de pas de simulation ou moins si une collision a lieu
        for(let i = 0, col = 0; i < this.simulationStep&& !col; ++i) {
            if(this.velocity.x != 0) {
                this.position.x += (this.velocity.x/this.simulationStep) * deltaTime;
                col += this.CollideX();
                collide += col;
            }
        }

        return collide;
    }

    /// Mise a jour du composant (posiiton, velocite, acceleration, dimension de la boite)
    Update(deltaTime) {
        // Si aucune taille n'est preciser lors de la creation du composant ajuste
        // la taille de la boite de collision automatiquement en acordance avec la taille de l'entite auquel le composant est attachea
        if(this.autoSize) {
            this.width = this.parent.scale.x;
            this.height = this.parent.scale.y;
            this.depth = this.parent.scale.z;
        }
    
        this.velocity.addScaledVector(this.acceleration, deltaTime);
        this.acceleration.set(0, 0, 0);
        // A tres grande vitesse il est possible de passe a traver les blocs
        // Pour eviter cela on Diviser les movement on une serie de plus petit pas
        // Cela n'est parfois pas suffisant et augmente le temps de calcule
        // On va donc egalement limiter la vitesse a une valeur qui depend de trois 
        // La vitesse maximum est determinee par trois variable:
        // - Le nombre de pas de simulation
        // - La taille du collider
        // - Le framerate (peut potentielemnt poser des problemes sur certaine des machines)
        let MaxSpeed = (1/ deltaTime) * Math.min(this.width, this.height, this.depth) * this.simulationStep - 10;
        // Limite la velocite
        if(this.velocity.length() > MaxSpeed) {
            this.velocity.normalize();
            this.velocity.multiplyScalar(MaxSpeed);
        }

        let collide;
        // Movements et collisions
        if(Math.abs(this.velocity.x) > Math.abs(this.velocity.z))
            collide = this.MoveAndCollideYXZ(deltaTime);
        else
            collide = this.MoveAndCollideYZX(deltaTime);
        
        // Ralentis les movements au sol plus rapidement que dans les airs
        if(this.onGround) {
            this.velocity.x *= this.friction;
            this.velocity.z *= this.friction;
        }else{
            this.velocity.x *= this.airFriction;
            this.velocity.z *= this.airFriction;
        }
        // Callback
        if(collide && this.onCollision) this.onCollision();
        
        // Actualise la position de la boite de collision et de l'entite qui la porte
        this.min.set(this.position.x, this.position.y, this.position.z);
        this.max.set(this.width + this.min.x, this.position.y + this.height, this.depth +  this.min.z);
        this.parent.position.set(this.position.x + this.posOffset.x, this.position.y + this.posOffset.y, this.position.z + this.posOffset.z);
    }
}
