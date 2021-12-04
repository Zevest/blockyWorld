class Component {
    constructor(object3D) {
        this.object3D = object3D;
        this.Start();
    }

    addComponent(Class, ...args) {
        let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);
        if(this.object3D.userData[className] == undefined)
            this.object3D.userData[className] = [];
        let comp = new Class(this.object3D, ...args);
        this.object3D.userData[className].push(comp);
        return comp;
    }
    
    hasComponent(Class) {
        if(typeof Class == 'string'){
            return (this.object3D.userData[Class] == undefined);
        }
        else
            return (this.object3D.userData[getClassName(Class)] == undefined);
    }   
    
    getComponent(Class, index = 0) {
        let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

        if(this.object3D.userData[className] == undefined) throw new Error(`Component ${className} not found in object3D`);
        return this.object3D.userData[className][index];
    }
    
    getComponents(Class) {
        let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);
        
        if(this.object3D.userData[className] == undefined) throw new Error(`Component ${className} not found in object3D`);
        return this.object3D.userData[className];
    }
    
    removeComponent(Class, index = 0) {
        let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

        if(this.object3D.userData[className] == undefined) return undefined;
        this.object3D.userData[className].splice(index, 0);
        if(oobject3d.userData[className].lenght = 0)
            this.object3D.userData[className] = undefined;
    }
    
    removeComponents(Class) {
        let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

        if(this.object3D.userData[className] == undefined) return undefined;
        this.object3D.userData[className].splice(0, this.object3D.userData[className].length);
        this.object3D.userData[className] = undefined;
    }

    Start() { }

    Update(deltaTime) { }
}

function addComponent(object3d, Class, ...args) {
    let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

    if(object3d.userData[className] == undefined)
        object3d.userData[className] = [];
    let comp = new Class(object3d, ...args);
    object3d.userData[className].push(comp);
    return comp;
}

function hasComponent(object3d, Class) {
    if(typeof Class == 'string'){
        return (object3d.userData[Class] == undefined);
    }
    else
        return (object3d.userData[getClassName(Class)] == undefined);
}   

function getComponent(object3d, Class, index = 0) {
    let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

    if(object3d.userData[className] == undefined) throw new Error(`Component ${className} not found in object3D`);
    return object3d.userData[className][index];
}

function getComponents(object3d, Class) {
    let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

    if(object3d.userData[className] == undefined) throw new Error(`Component ${className} not found in object3D`);
    return object3d.userData[className];
}

function removeComponent(object3d, Class, index = 0) {
    let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

    if(object3d.userData[className] == undefined) return undefined;
    object3d.userData[className].splice(index, 0);
    if(object3d.userData[className].lenght = 0)
        object3d.userData[className] = undefined;
}

function removeComponents(object3d, Class) {
    let className;
        if(typeof Class == 'string') className = Class;
        else className = getClassName(Class);

    if(object3d.userData[className] == undefined) return undefined;
    object3d.userData[className].splice(0, object3d.userData[className].length);
    object3d.userData[className] = undefined;
}