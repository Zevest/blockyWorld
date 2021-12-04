class Entity {
    static Entities = {}
    static COUNTER = 0;
    static AddEntity(entity){
        Entity.Entities[Entity.COUNTER++] = entity;
    }

    static GetEntity(id){
        return Entity.Entities[id];
    }

    static RemoveEntity(id){
        delete Entity.Entities[id];
    }

    static NewEntity(object3D, add = true){
        let e = new Entity(object3D);
        if(add) Entity.AddEntity(e);
        return e;
    }

    static Start() {
        for(let ID in Entity.Entities){
            let entity  = Entity.Entities[ID];
            entity._Start();
        }
    }

    static Update(deltaTime) {
        for(let ID in Entity.Entities){
            let entity  = Entity.Entities[ID];
            entity._Update(deltaTime);
        }
    }

    constructor(Object3D){
        if(Object3D)
            this.transform = Object3D;
        else
            this.transform = new THREE.Object3D();
        this.transform.userData.entity = this;
        this.components = {};
        Entity.AddEntity(this);
    }

    addComponent(Class, ...args) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined)
            this.components[className] = [];
        let comp = new Class(this.transform, ...args);
        this.components[className].push(comp);
        return comp;
    }

    hasComponent(Class) {
        if(typeof Class == 'string'){
            return (this.components[Class] == undefined);
        }
        else
            return (this.components[getClassName(Class)] == undefined);
    }   

    getComponent(Class, index = 0) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);
        if(this.components[className] == undefined) throw new Error(`Component ${className} not found in entity`);
        return this.components[className][index];
    }

    getComponents(Class) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined) throw new Error(`Component ${className} not found in object3D`);
        return this.components[className];
    }

    removeComponent(Class, index = 0) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined) return undefined;
        this.components[className].splice(index, 0);
        if(this.components[className].lenght = 0)
            this.components[className] = undefined;
    }

    removeComponents(Class) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined) return undefined;
        this.components[className].splice(0, this.components[className].length);
        this.components[className] = undefined;
    }

    _Start(){
        this.Start();
        for(let ComponentType in this.components){
            for(let component of this.components[ComponentType]){
                component.Start();
            }
        }
    }

    _Update(deltaTime) {
        this.Update(deltaTime);
        for(let ComponentType in this.components){
            for(let component of this.components[ComponentType]){
                component.Update(deltaTime);
            }
        }

    }

    Update(deltaTime) {}
    Start(deltaTime) {}

}