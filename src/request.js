class Request {
    /// Cree un requete HTTP
    static getFile(url, onLoadEndCallback, onErrorCallback) {
        let xhr = new XMLHttpRequest();  
        xhr.open("GET", url);

        xhr.onloadend = function() { 
            onLoadEndCallback(this.response);
        };
        xhr.onerror = function() { 
            onErrorCallback(this);
        };
        xhr.send();
    }
}