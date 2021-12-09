/// Un element dans la scene ayant un matrice de transformation pouvant contenir des componants
class Entity {
    static Entities = {} // stocke toutes les entites
    static COUNTER = 0;
    // Ajoute une entite dans le system
    static AddEntity(entity) {
        Entity.Entities[Entity.COUNTER++] = entity;
    }

    // Recupere une entite dans le systeme
    static GetEntity(id) {
        return Entity.Entities[id];
    }

    // Supprime une entite du systeme
    static RemoveEntity(id) {
        delete Entity.Entities[id];
    }

    // Cree un entite et l'ajoute dans le systeme si demande
    static NewEntity(object3D, add = true) { 
        let e = new Entity(object3D, add);
        if(add) Entity.AddEntity(e);
        return e;
    }

    /// Initialise toutes les entites
    static Start() {
        for(let ID in Entity.Entities) {
            let entity  = Entity.Entities[ID];
            entity._Start();
        }
    }

    /// Met a jour toutes les entites
    static Update(deltaTime) {
        for(let ID in Entity.Entities) {
            let entity  = Entity.Entities[ID];
            entity._Update(deltaTime);
        }
    }
    
    constructor(Object3D, add = true) {
        if(Object3D)
            this.transform = Object3D;
        else
            this.transform = new THREE.Object3D();
        this.transform.userData.entity = this;
        this.components = {};
        if(add) Entity.AddEntity(this);
    }
    /// Ajoute un composant a l'entite
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

    /// Verifie si l'entite possde le composant demande
    hasComponent(Class) {
        if(typeof Class == 'string') {
            return !(this.components[Class] == undefined);
        }
        else
            return !(this.components[getClassName(Class)] == undefined);
    }   

    /// Recupere un composant de l'entite a l'indice indique
    getComponent(Class, index = 0) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);
        if(this.components[className] == undefined) throw new Error(`Component ${className} not found in entity`);
        return this.components[className][index];
    }

    /// Tous les composants de l'entite du type indique
    getComponents(Class) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined) throw new Error(`Component ${className} not found in object3D`);
        return this.components[className];
    }

    /// Supprime un composant de l'entite a l'indice indique
    removeComponent(Class, index = 0) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined) return undefined;
        this.components[className].splice(index, 0);
        if(this.components[className].lenght = 0)
            delete this.components[className];
    }
    /// Supprime tous les composants de l'entite su type indique
    removeComponents(Class) {
        let className;
            if(typeof Class == 'string') className = Class;
            else className = getClassName(Class);

        if(this.components[className] == undefined) return undefined;
        this.components[className].splice(0, this.components[className].length);
        delete this.components[className];
    }

    /// Initialise tous les composants de l'entite
    _Start() {
        this.Start();
        for(let ComponentType in this.components) {
            for(let component of this.components[ComponentType]) {
                component.Start();
            }
        }
    }

    /// Met a jour tous les composants de l'entite
    _Update(deltaTime) {
        this.Update(deltaTime);
        for(let ComponentType in this.components) {
            for(let component of this.components[ComponentType]) {
                component.Update(deltaTime);
            }
        }

    }

    /// L'Implemention doit etre fournit par les classes fille
    Update(deltaTime) {}
    /// L'Implemention doit etre fournit par les classes fille
    Start(deltaTime) {}

}