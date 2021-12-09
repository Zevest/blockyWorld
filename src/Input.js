const M_LEFT = 1;
const M_MIDDLE = 2;
const M_RIGHT = 3;

class Input {
    /// Gere les input utilisateur

    //Stocke les boutons du clavier enfonce
    static keyBoardPress = {};
    //Stock le dernier etat de la souris
    static mouseEvent = {button: {}, position:{x:0, y:0}, move:{x:0, y:0, changed:false}, wheel:{ deltaX:0, deltaY:0}};
    
    static hasFocus = false;
    static hasMouseLock = false;

    // Callbaks
    static onClick = null;
    static onKeyDown = null;
    static onKeyUp = null;
    static onMouseDown = null;
    static onMouseUp = null;
    static onMouseWheel = null;

    /// Getters pour les constantes
    static get M_LEFT() {
        return M_LEFT;
    }
    
    static get M_MIDDLE() {
        return M_MIDDLE;
    }

    static get M_RIGHT() {
        return M_RIGHT;
    }

    /// Initialiase les EventListeners  pour les entres utilisateur
    static Init (obj, updateRate = 60) {
        // Events Focus de la fenetre
        window.addEventListener("focus",() => {Input.onFocus(obj);});
        window.addEventListener("blur",() => {Input.onLostFocus(obj); /*Input.lockChangeAlert(obj)*/;});
        
        // Events clavier
        window.addEventListener("keydown", (event) => Input.keyDown(event.key))
        window.addEventListener("keyup", (event) => Input.keyUp(event.key, event.code, event));
        
        // Events capture de la souris dans le canvas
        obj.requestPointerLock = obj.requestPointerLock || obj.mozRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
        document.addEventListener('pointerlockchange', () => Input.lockChangeAlert(obj), false);
        document.addEventListener('mozpointerlockchange', () => Input.lockChangeAlert(obj), false);

        // Desactive certains raccourcis clavier
        Input.disbaleShortCut();

        // Events de la souris
        obj.addEventListener("click", (event) => { 
            if(!Input.hasMouseLock) obj.requestPointerLock(); 
            if(Input.onClick) Input.onClick(event.which);
        });
        obj.addEventListener("mousedown",  (event) => {Input.mouseDown(event.which, event.x, event.y)})
        obj.addEventListener("mouseup", (event) => {Input.mouseUp(event.which, event.x, event.y)})        
        obj.addEventListener("mousewheel", (event) => {Input.mouseWheel(event.deltaX, event.deltaY)});

        // Desactive le menu contextuel
        obj.oncontextmenu = () => {return false;};
        window.setInterval(() => Input.updateInput(), 1 / updateRate); 
    }

    /// Active ou desactive le callback MouseMove
    static lockChangeAlert(obj) {
        if (document.pointerLockElement === obj ||
            document.mozPointerLockElement === obj) {
            Input.hasMouseLock = true;
            obj.addEventListener("mousemove", Input.mouseMove)
        } else {
            Input.hasMouseLock = false;
            // Reset le status des boutons
            Input.dropInputStatus();
            obj.removeEventListener("mousemove", Input.mouseMove);
        }
    }

    /// Callback a l'enfoncement d'une touche du clavier
    static keyDown(key) {
        if(!Input.hasMouseLock) return;
        if(key.length == 1) {
            key = key.toLowerCase();
        }
        if(Input.onKeyDown) Input.onKeyDown(key);
        Input.keyBoardPress[key] = true;
    }

    /// Callback au relachement d'une touche du clavier
    static keyUp(key) {
        if(!Input.hasMouseLock) return;
        if(key.length == 1) {
            key = key.toLowerCase();
        }
        if(Input.onKeyUp) Input.onKeyUp(key);
        Input.keyBoardPress[key] = false;
    }

    /// Recupere l'etat d'une touche du clavier
    static getKey(key) {
        if(Input.keyBoardPress[key] == undefined) return false;
        return Input.keyBoardPress[key];
    }

    /// Recupere l'etat d'un boutons du clavier
    static getMouseButton(button) {
        if(Input.mouseEvent.button[`${button}`] == undefined) return false;
        return Input.mouseEvent.button[`${button}`];
    }

    /// Recupere la position de la souris
    static getMousePosition() {
        return Input.mouseEvent.position;
    }

    /// Recupere le dernier movement de la souris
    static getMouseMovement() {
        return Input.mouseEvent.move;
    }

    /// Callback a l'enfoncement d'un bouton de la souris
    static mouseDown(button) {
        if(!Input.hasMouseLock)Input.mouseEvent.button[`${button}`] = true;
        if(Input.onMouseDown) Input.onMouseDown(button);
    }

    /// Callback au relachement d'un bouton de la souris
    static mouseUp(button) {
        if(!Input.hasMouseLock) Input.mouseEvent.button[`${button}`] = false;
        if(Input.onMouseUp) Input.onMouseUp(button);
    }

    /// Callback au mouvement de la souris
    static mouseMove(event) {
        if(/*Input.hasFocus && */Input.hasMouseLock) {
            Input.mouseEvent.position.x = event.x;
            Input.mouseEvent.position.y = event.y;
            Input.mouseEvent.move.x = event.movementX;
            Input.mouseEvent.move.y = event.movementY;
            Input.mouseEvent.move.changed = (event.movementX != 0 ||event.movementY != 0);
        }
    }

    /// Callback au roulement de la molette de la souris
    static mouseWheel(deltaX, deltaY) {
        if(Input.hasMouseLock) {
            Input.mouseEvent.wheel.deltaX = deltaX;
            Input.mouseEvent.wheel.deltaY = deltaY;
            if(Input.onMouseWheel)
                Input.onMouseWheel(
                    Math.sign(Input.mouseEvent.wheel.deltaX),
                    Math.sign(Input.mouseEvent.wheel.deltaY)
                );
        }
    }

    /// Callback a la recuperation du focus de la fenetre
    static onFocus() {
        Input.hasFocus = true;
    }

    /// Reinitialise l'etat des entrees utilisateur stockes
    static dropInputStatus() {
        for(const button in Input.mouseEvent.button)
            Input.mouseEvent.button[button] = false;
        for(const key in Input.keyBoardPress)
            Input.keyBoardPress[key] = false;
        Input.mouseEvent.position.x = 0;
        Input.mouseEvent.position.y = 0;
        Input.mouseEvent.move.x = 0;
        Input.mouseEvent.move.y = 0;
        Input.mouseEvent.move.changed = false;
    }

    /// Callback a la perte de focus de la fenetre
    static onLostFocus() {
        Input.hasFocus = false;
        Input.mouseEvent.move.changed = false;
    }

    /// Desactive certain shortcut avec le boutons CRTL
    static disbaleShortCut() {
        window.document.body.onkeydown = (event) => {
            if(this.hasMouseLock && event.ctrlKey)
                event.preventDefault();
            return true;
        }
    }

    /// Actualise l'etat du mouvement de la souris
    static updateInput() {
        if(Input.mouseEvent.move.changed) {
            Input.mouseEvent.move.changed = false;
            
            //Input.mouseEvent.move.x = 0;
            //Input.mouseEvent.move.y = 0;
        }
    }
}

