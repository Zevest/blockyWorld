let app
function main() {
    if (WEBGL.isWebGLAvailable()) {
        //Ammo().then(() => {
            app = new Application();
            app.start();
            
        //});
    } else {
        const warning = WEBGL.getWebGLErrorMessage();
        let div = document.createElement("div");
        div.id = "container";
        document.body.appendChild(div);
        document.getElementById("container").appendChild(warning);
    }
}
main();