import {Meteor} from 'meteor/meteor';
import {JsonRoutes} from 'meteor/simple:json-routes'
Meteor.startup(function () {
    // Enable cross origin requests for all endpoints
    JsonRoutes.setResponseHeaders({
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    });

// Listen to incoming HTTP requests, can only be used on the server
    WebApp.rawConnectHandlers.use("/", function (req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return next();
    });
});