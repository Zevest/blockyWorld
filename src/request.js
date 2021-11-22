class Request {

    static requestMap = {};
    static requestCount = 0;
    static resultCount = 0;

    static callbackFunc = null;
    static win = null;

    //https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    

    static setFilesLoadedCallBackFunction(callback, target)
    {
        callbackFunc = callback;   
        win = target;
    }

    static getRequestCount() {
        let count = 0;
        for(let elm in Request.requestMap) ++count;
        return count;
    }

    static requestImage(url, onLoadEndCallback, onErrorCallback) {
        let img = new Image();
        img.src = url;
        if(onLoadEndCallback != undefined || onErrorCallback != undefined){       
            img.onloadend = function() { 
                onLoadEndCallback(this.response);
            };
            img.onerror = function() { 
                onErrorCallback(this);
            };
        }
        else{
            // Generate a uinique identifier
            const n63BitMaxVal = 9223372036854776000;
            let request = {URL: url/*, data: undefined*/, status: 0, statusText: "", type: "image", response : undefined};
            let hash = url.hashCode();
            let uuid = Number(Math.random() * n63BitMaxVal %  Math.abs(hash) * hash);
            Request.requestMap[`${uuid}`] = request;
            ++Request.requestCount;
            
            img.onload = function() {
                ++Request.resultCount;     
                request.status = "ok";
                request.statusText = 200;
                request.response = this;
                // Start the app when all requests are completed
                if(Request.resultCount == Request.requestCount)
                    callbackFunc(win);
            };

            img.onerror = function() {
                console.error("Error 404: File not Found");
                request.status = 4040;
                request.statusText = "File not Found";
                ++Request.resultCount;
            };  
            return uuid;
        }
    }

    /// make draw.js call the setup and other func on event callback if all file are loaded
    static requestFile(url, type= "", onLoadEndCallback = undefined, onErrorCallback = undefined) {
        // TODO: Make a request for image
        if(type == "image")
            return requestImage(url, onLoadEndCallback, onErrorCallback);
        
        let xhr = new XMLHttpRequest();  
        xhr.open("GET", url);

        if(onLoadEndCallback != undefined || onErrorCallback != undefined){       
            xhr.onloadend = function() { 
                onLoadEndCallback(this.response);
            };
            xhr.onerror = function() { 
                onErrorCallback(this);
            };
            xhr.send();
        }
        else{
            // Generate a uinique identifier
            const n63BitMaxVal = 9223372036854776000;
            let request = {URL: url/*, data: undefined*/, status: 0, statusText: "", type, response : undefined};
            let hash = url.hashCode();
            let uuid = Number(Math.random() * n63BitMaxVal %  Math.abs(hash) * hash);
            Request.requestMap[`${uuid}`] = request;
            ++Request.requestCount;
            
            xhr.onloadend = function() {
                ++Request.resultCount;     
                request.status = this.status;
                request.statusText = this.statusText;
                request.response = this.response;

                if(xhr.responseType != "")
                    request.type = this.responseType;
                // Start the app when all requests are completed
                if(Request.resultCount == Request.requestCount)
                    callbackFunc(win);
            };

            xhr.onerror = function() {
                console.error(`Error ${this.status}: ${this.statusText}`);
                request.status = this.status;
                request.statusText = this.statusText;
                request.type = this.responseType;
                ++Request.resultCount;
            };
            xhr.send();
            
            return uuid;
        }
    }

    static getRequestResult(uuid) {
        return Request.requestMap[`${uuid}`];
    }

    static getRequestData(uuid) {
        let request = Request.requestMap[`${uuid}`];
        switch(request.type) {
            default:
            case "text":
                return  request.response;
            case "document":
                let parser = new DOMParser();
                return parser.parseFromString(request.response, "text/xml");
            case "json":
                return JSON.parse(request.response);
            case "arraybuffer":
                return Buffer.from(request.response);
                //throw new Error(`XMLHttpRequest reponseType for ${request.type} not implemented`);
            case "blob":
                throw new Error(`XMLHttpRequest reponseType for ${request.type} not implemented`);
            case "image":
                return request.response;
        }
    }

    static getRequestStatus(uuid) {
        return Request.requestMap[`${uuid}`].status;
    }

    static deleteRequestData(uuid) {
        if(Request.requestMap[`${uuid}`] != undefined){
            --Request.requestCount;
            --Request.resultCount;
            delete Request.requestMap[`${uuid}`];
        }
    }
}

String.prototype.hashCode = function() {
    let hash = 0;
    if (this.length == 0) return hash;
    for (let i = 0; i < this.length; i++) {
        let char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};