const M_LEFT = 1;
const M_MIDDLE = 2;
const M_RIGHT = 3;

class Input {
    static keyBoardPress = {};
    static mouseEvent = {button: {}, position:{x:0, y:0}, move:{x:0, y:0, changed:false}, wheel:{ deltaX:0, deltaY:0}};
    static hasFocus = false;
    static hasMouseLock = false;

    static onClick = null;
    static onKeyDown = null;
    static onKeyUp = null;
    static onMouseDown = null;
    static onMouseUp = null;
    static onMouseWheel = null;

    static get M_LEFT() {
        return M_LEFT;
    }
    
    static get M_MIDDLE() {
        return M_MIDDLE;
    }

    static get M_RIGHT() {
        return M_RIGHT;
    }

    static Init (obj, updateRate = 60) {
        window.addEventListener("focus",() => {Input.onFocus(obj);});
        window.addEventListener("blur",() => {Input.onLostFocus(obj); /*Input.lockChangeAlert(obj)*/;});
        window.addEventListener("keydown", (event) => Input.keyDown(event.key))
        window.addEventListener("keyup", (event) => Input.keyUp(event.key, event.code, event));
            
        obj.requestPointerLock = obj.requestPointerLock || obj.mozRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
        document.addEventListener('pointerlockchange', () => Input.lockChangeAlert(obj), false);
        document.addEventListener('mozpointerlockchange', () => Input.lockChangeAlert(obj), false);
        
        Input.disbaleShortCut();

        obj.addEventListener("click", (event) => { 
            if(!Input.hasMouseLock) obj.requestPointerLock(); 
            if(Input.onClick) Input.onClick(event.which);
        });
        obj.addEventListener("mousedown",  (event) => {Input.mouseDown(event.which, event.x, event.y)})
        obj.addEventListener("mouseup", (event) => {Input.mouseUp(event.which, event.x, event.y)})        
        obj.oncontextmenu = () => {return false;};
        obj.addEventListener("mousewheel", (event) => {Input.mouseWheel(event.deltaX, event.deltaY)});
        window.setInterval(() => Input.updateInput(), 1 / updateRate); 
    }

    static lockChangeAlert(obj) {
        if (document.pointerLockElement === obj ||
            document.mozPointerLockElement === obj) {
            Input.hasMouseLock = true;
            obj.addEventListener("mousemove", Input.mouseMove)
        } else {
            Input.hasMouseLock = false;
            Input.dropInputStatus();
            obj.removeEventListener("mousemove", Input.mouseMove);
        }
    }

    static keyDown(key) {
        if(!Input.hasMouseLock) return;
        if(key.length == 1){
            key = key.toLowerCase();
        }
        if(Input.onKeyDown) Input.onKeyDown(key);
        Input.keyBoardPress[key] = true;
    }

    static keyUp(key) {
        if(!Input.hasMouseLock) return;
        if(key.length == 1){
            key = key.toLowerCase();
        }
        if(Input.onKeyUp) Input.onKeyUp(key);
        Input.keyBoardPress[key] = false;
    }

    static getKey(key) {
        if(Input.keyBoardPress[key] == undefined) return false;
        return Input.keyBoardPress[key];
    }

    static getMouseButton(button) {
        if(Input.mouseEvent.button[`${button}`] == undefined) return false;
        return Input.mouseEvent.button[`${button}`];
    }

    static getMousePosition() {
        return Input.mouseEvent.position;
    }

    static getMouseMovement() {
        return Input.mouseEvent.move;
    }

    static mouseDown(button) {
        if(!Input.hasMouseLock)Input.mouseEvent.button[`${button}`] = true;
        if(Input.onMouseDown) Input.onMouseDown(button);
    }

    static mouseUp(button) {
        if(!Input.hasMouseLock) Input.mouseEvent.button[`${button}`] = false;
        if(Input.onMouseUp) Input.onMouseUp(button);
    }

    static mouseMove(event) {
        if(/*Input.hasFocus && */Input.hasMouseLock){
            Input.mouseEvent.position.x = event.x;
            Input.mouseEvent.position.y = event.y;
            Input.mouseEvent.move.x = event.movementX;
            Input.mouseEvent.move.y = event.movementY;
            Input.mouseEvent.move.changed = (event.movementX != 0 ||event.movementY != 0);
        }
    }

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

    static onFocus() {
        Input.hasFocus = true;
    }

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

    static onLostFocus() {
        Input.hasFocus = false;
        Input.mouseEvent.move.changed = false;
    }

    static disbaleShortCut() {
        window.document.body.onkeydown = (event) => {
            if(this.hasMouseLock && event.ctrlKey)
                event.preventDefault();
            return true;
        }
    }

    static updateInput() {
        if(Input.mouseEvent.move.changed){
            Input.mouseEvent.move.changed = false;
            
            //Input.mouseEvent.move.x = 0;
            //Input.mouseEvent.move.y = 0;
        }
    }
}

