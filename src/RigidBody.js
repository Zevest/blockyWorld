class RigidBody extends Component{
    static BOX = 0;
    static CAPSULE = 1;
    static SPHERE = 2;
    static State = { DISABLE_DEACTIVATION : 4 };
    static Flags = { CF_KINEMATIC_OBJECT: 2 };

    static tmpVec3a;
    static tmpVec3b;
    static tmpTrans;

    constructor(object3D, type, mass = 1.0, allowRotation = true,  collisionGroup = 1, collideWithGroup = 1) {
        super(object3D);
        this.mass = mass;
       
        if(RigidBody.tmpVec3a == undefined) {
            RigidBody.tmpVec3a = new Ammo.btVector3(0,0,0);
            RigidBody.tmpVec3b = new Ammo.btVector3(0,0,0);
        }
        if(RigidBody.tmpTrans == undefined) {
            RigidBody.tmpTrans = new Ammo.btTransform();
        }
        switch(type) {
            case RigidBody.BOX:
                    this.initBoxShape(allowRotation, collisionGroup, collideWithGroup);
                break;
            case RigidBody.CAPSULE:
                    this.initCapsuleShape(allowRotation, collisionGroup, collideWithGroup);
                break;
            case RigidBody.SPHERE:
                    this.initSphereShape(allowRotation, collisionGroup, collideWithGroup);
                break;
            default:
                throw new Error("Unknown type: " + type);
        }
    }

    initBoxShape(allowRotation,  collisionGroup, collideWithGroup) {
        let pos = this.object3D.position, rotationQ = this.object3D.quaternion, scale = this.object3D.scale;
        let transform = new Ammo.btTransform();
        
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(rotationQ.x, rotationQ.y, rotationQ.z, rotationQ.w));
        this.motionState = new Ammo.btDefaultMotionState(transform);

        this.collisionShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
        this.collisionShape.setMargin(0.05);

        this.localInertia = new Ammo.btVector3(0, 0, 0);
        // Enable Rotations
        if(allowRotation)
            this.collisionShape.calculateLocalInertia(this.mass, this.localInertia);

        this.rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, this.motionState, this.collisionShape, this.localInertia);
        this.body = new Ammo.btRigidBody(this.rigidBodyInfo);

        //this.object3D.userData.rigidBody = this.body;
        //addToPhisicsWorld(this.object3D, this.body, collisionGroup, collideWithGroup)
    }

    initCapsuleShape(allowRotation,  collisionGroup, collideWithGroup) {

    }

    initSphereShape(allowRotation,  collisionGroup, collideWithGroup) {

    }

    addToPhysicsData(physicsData) {
       physicsData.world.addRigidBody(this.body, this.collisionGroup, this.collideWithGroup);
       physicsData.dynamicRigidBodies.push(this.object3D);
    }

    setVector(dest, v, y, z) {
        if(y == undefined || z == undefined) {
            dest.setX(v.x);
            dest.setY(v.y);
            dest.setZ(v.z);
        
        }else {
            dest.setX(v);
            dest.setY(y);
            dest.setZ(z);
        }
    }

    applyImpulse(v, y, z) {
        this.setVector(RigidBody.tmpVec3a, v, y, z);
        this.setVector(RigidBody.tmpVec3b, 0, 0, 0);
        this.body.applyImpulse(RigidBody.tmpVec3a, RigidBody.tmpVec3b);
    }

    applyForce(v, y, z) {
        this.setVector(RigidBody.tmpVec3a, v, y, z);
        this.setVector(RigidBody.tmpVec3b, 0, 0, 0);
        this.body.applyForce(RigidBody.tmpVec3a, RigidBody.tmpVec3b);
    }

    setLinearVelocity(v, y, z) {
        this.setVector(RigidBody.tmpVec3a, v, y, z);
        this.body.setLinearVelocity(RigidBody.tmpVec3a);
    }

    setAngularVelocity(v, y, z) {
        this.setVector(RigidBody.tmpVec3a, v, y, z);
        this.body.setAngularVelocity(RigidBody.tmpVec3a);
    }
    

    Update(deltaTime) {
        this.moveKinematic();
    }

    moveKinematic() {
        //let rigidBody = getComponent(obj, RigidBody);
        //const motionState = rigidBody.body.getMotionState();
        if(this.motionState != undefined) {
            this.motionState.getWorldTransform(RigidBody.tmpTrans);
            let pos = RigidBody.tmpTrans.getOrigin();
            let rotQ = RigidBody.tmpTrans.getRotation();
            this.object3D.position.set(pos.x(), pos.y(), pos.z());
            this.object3D.quaternion.set(rotQ.x(), rotQ.y(), rotQ.z(), rotQ.w());
        }
    }
}