class Component {
    /// Definie un composant d'une entite
    /// Sont initialiser une fois en meme temps que l'entite
    /// Les composant sont mis a jour en meme temps de l'entite
    constructor(object3D) {
        this.parent = object3D;
    }
    /// Fontion d'initialisatoin a implementer dans une class fille
    Start() { }

    /// Fonction de mise a jout a implementer dans une class fille
    Update(deltaTime) { }
    
}