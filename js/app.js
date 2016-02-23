requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
      "app": "../app",
      "jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
      "jquery-ui":"//code.jquery.com/ui/1.11.4/jquery-ui.min",
      "canvas-resize":"canvas-resize"
    }
});

// Load the main app module to start the app
requirejs(["app/main"]);